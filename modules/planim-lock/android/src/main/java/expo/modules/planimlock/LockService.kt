package expo.modules.planimlock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import org.json.JSONArray
import org.json.JSONObject

/**
 * Watches which app is in the foreground (UsageStats) once a second during a lesson.
 * Blocked apps get the LockActivity on top. Foreground time of every other app is logged for the report.
 */
class LockService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var current: String? = null
  private var lastQuery = 0L
  private var lastBlockAt = 0L
  private var homePackages: Set<String> = emptySet()

  private val tick = object : Runnable {
    override fun run() {
      try { doTick() } catch (_: Throwable) { }
      if (running) handler.postDelayed(this, 1000)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val cfg = readCfg()
    if (cfg == null) { stopSelf(); return START_NOT_STICKY }
    startAsForeground(cfg)
    homePackages = resolveHomePackages()
    running = true
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  /** Uygulama son uygulamalardan silinirse ve ders sürüyorsa uygulamayı yeniden açar (çalışma ekranına StudyResume döndürür). */
  override fun onTaskRemoved(rootIntent: Intent?) {
    try {
      val cfg = readCfg()
      if (running && cfg != null && System.currentTimeMillis() < cfg.optLong("endAt", 0L) + 30 * 60 * 1000L) {
        packageManager.getLaunchIntentForPackage(packageName)?.let { launch ->
          launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
          startActivity(launch)
        }
      }
    } catch (_: Throwable) { }
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    running = false
    handler.removeCallbacks(tick)
    Store.flush(this)
    super.onDestroy()
  }

  private fun readCfg(): JSONObject? = try {
    val s = Store.getString(this, "lock", "")
    if (s.isEmpty()) null else JSONObject(s)
  } catch (_: Throwable) { null }

  private fun set(arr: JSONArray?): Set<String> {
    val out = HashSet<String>()
    if (arr != null) for (i in 0 until arr.length()) out.add(arr.getString(i))
    return out
  }

  private fun resolveHomePackages(): Set<String> {
    val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    return packageManager.queryIntentActivities(i, PackageManager.MATCH_DEFAULT_ONLY or PackageManager.MATCH_ALL)
      .map { it.activityInfo.packageName }.toSet()
  }

  private fun doTick() {
    val cfg = readCfg() ?: run { finishLock(); return }
    val now = System.currentTimeMillis()
    val brkStart = cfg.optLong("breakStartedAt", 0L)
    val brkExtra = if (brkStart > 0L) maxOf(0L, minOf(now, cfg.optLong("breakUntil", 0L)) - brkStart) else 0L
    if (now >= cfg.optLong("endAt", 0L) + brkExtra) { finishLock(); return }
    Store.putLong(this, "lastTick", now)

    refreshForeground(now)
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    if (!pm.isInteractive) return
    val pkg = current ?: return
    if (pkg == packageName || pkg == "com.android.systemui" || pkg in homePackages) return

    Store.addUsage(this, pkg)

    val blocked = set(cfg.optJSONArray("blocked"))
    val always = set(cfg.optJSONArray("allowed"))
    val friend = set(cfg.optJSONArray("friend"))
    val friendOpen = cfg.optLong("friendUntil", 0L) > now
    if (pkg in always) return
    if (cfg.optLong("breakUntil", 0L) > now) return
    if (friendOpen && pkg in friend) return
    if (pkg in blocked && now - lastBlockAt > 2500L) {
      lastBlockAt = now
      Store.addBlock(this, pkg)
      try {
        startActivity(
          Intent(this, LockActivity::class.java)
            .putExtra("pkg", pkg)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),
        )
      } catch (_: Throwable) { }
    }
  }

  @Suppress("DEPRECATION")
  private fun refreshForeground(now: Long) {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val from = if (lastQuery == 0L) now - 10 * 60 * 1000L else lastQuery - 1500L
    val events = usm.queryEvents(from, now)
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) current = e.packageName
    }
    lastQuery = now
  }

  private fun finishLock() {
    Store.putString(this, "lock", "")
    Store.flush(this)
    running = false
    handler.removeCallbacks(tick)
    stopForeground(true)
    stopSelf()
  }

  private fun startAsForeground(cfg: JSONObject) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL, "Çalışma modu", NotificationManager.IMPORTANCE_LOW))
    }
    val open = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    val pi = PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else @Suppress("DEPRECATION") Notification.Builder(this)
    val n = builder
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentTitle("Çalışma modu açık")
      .setContentText(cfg.optString("lessonName", "Ders") + " devam ediyor")
      .setOngoing(true)
      .setContentIntent(pi)
      .build()
    if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(NOTIF_ID, n)
  }

  companion object {
    const val CHANNEL = "planim_lock_service_v1"
    const val NOTIF_ID = 4101
    @Volatile var running = false
  }
}
