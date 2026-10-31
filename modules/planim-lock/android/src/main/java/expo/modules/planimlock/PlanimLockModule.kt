package expo.modules.planimlock

import android.app.AppOpsManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import org.json.JSONArray
import org.json.JSONObject

class PlanimLockModule : Module() {
  private var preview: Ringtone? = null

  private val ctx: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun openSettings(action: String, withPackage: Boolean) {
    val i = Intent(action)
    if (withPackage) i.data = Uri.parse("package:${ctx.packageName}")
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      ctx.startActivity(i)
    } catch (_: Throwable) {
      ctx.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }
  }

  /** Kullanım erişimi gerçekten verilmiş mi? Bazı cihazlar izin açıkken MODE_DEFAULT döndürür; o durumda gerçek izne bakılır. */
  private fun usageAccessGranted(): Boolean {
    return try {
      val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= 29) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      }
      when (mode) {
        AppOpsManager.MODE_ALLOWED -> true
        AppOpsManager.MODE_DEFAULT ->
          ctx.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) == android.content.pm.PackageManager.PERMISSION_GRANTED
        else -> false
      }
    } catch (_: Throwable) {
      false
    }
  }

  /** Kullanım erişimi ekranını açar: önce uygulamanın kendi satırı, olmazsa genel liste, olmazsa uygulama bilgisi. */
  private fun openUsageAccess() {
    val pkgUri = Uri.parse("package:${ctx.packageName}")
    val attempts = ArrayList<Intent>()
    if (Build.VERSION.SDK_INT >= 29) attempts.add(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, pkgUri))
    attempts.add(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    attempts.add(Intent("android.settings.USAGE_ACCESS_SETTINGS"))
    attempts.add(Intent(Settings.ACTION_SECURITY_SETTINGS))
    attempts.add(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri))
    for (i in attempts) {
      try {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(i)
        return
      } catch (_: Throwable) {
        // sıradaki yolu dene
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("PlanimLock")

    Function("hasUsageAccess") { usageAccessGranted() }

    Function("hasOverlayAccess") { Settings.canDrawOverlays(ctx) }

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= 34) {
        (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).canUseFullScreenIntent()
      } else true
    }

    Function("openUsageAccessSettings") { openUsageAccess() }
    Function("openOverlaySettings") { openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, true) }
    Function("openFullScreenIntentSettings") { openSettings("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT", true) }

    // JSON: [{"pkg": "...", "label": "..."}]
    Function("getLaunchableApps") {
      val pm = ctx.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val seen = HashSet<String>()
      val list = ArrayList<Pair<String, String>>()
      for (ri in pm.queryIntentActivities(intent, 0)) {
        val p = ri.activityInfo.packageName
        if (p == ctx.packageName || !seen.add(p)) continue
        list.add(Pair(p, ri.loadLabel(pm).toString()))
      }
      list.sortBy { it.second.lowercase() }
      val arr = JSONArray()
      list.forEach { arr.put(JSONObject().put("pkg", it.first).put("label", it.second)) }
      arr.toString()
    }

    // Telefondaki alarm sesleri. JSON: [{"title","uri"}]
    Function("getAlarmSounds") {
      val arr = JSONArray()
      try {
        val rm = RingtoneManager(ctx).apply { setType(RingtoneManager.TYPE_ALARM) }
        val c = rm.cursor
        while (c.moveToNext()) {
          arr.put(JSONObject().put("title", c.getString(RingtoneManager.TITLE_COLUMN_INDEX)).put("uri", rm.getRingtoneUri(c.position).toString()))
        }
      } catch (_: Throwable) { }
      arr.toString()
    }

    // Dersin başlangıç alarmında çalacak ses ("" = telefonun varsayılan alarm sesi).
    Function("setAlarmSound") { uri: String -> Store.putString(ctx, "alarmSound", uri) }

    Function("previewSound") { uri: String ->
      try { preview?.stop() } catch (_: Throwable) { }
      try {
        val target = if (uri.isEmpty()) RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) else Uri.parse(uri)
        preview = RingtoneManager.getRingtone(ctx, target)?.apply {
          audioAttributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
          play()
        }
      } catch (_: Throwable) { }
    }

    Function("stopPreview") { try { preview?.stop() } catch (_: Throwable) { } }

    // Dialer, SMS, contacts: never blocked. JSON: ["pkg", ...]
    Function("getEmergencyPackages") {
      val pm = ctx.packageManager
      val out = LinkedHashSet<String>()
      val intents = listOf(
        Intent(Intent.ACTION_DIAL, Uri.parse("tel:")),
        Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:")),
        Intent(Intent.ACTION_VIEW, Uri.parse("content://contacts/people/")),
      )
      for (i in intents) pm.queryIntentActivities(i, 0).forEach { out.add(it.activityInfo.packageName) }
      listOf(
        "com.android.phone", "com.android.dialer", "com.google.android.dialer", "com.samsung.android.dialer",
        "com.android.contacts", "com.google.android.contacts", "com.samsung.android.app.contacts",
        "com.android.mms", "com.google.android.apps.messaging", "com.samsung.android.messaging", "com.android.emergency",
      ).forEach { out.add(it) }
      JSONArray(out.toList()).toString()
    }

    // JSON: [{"id","name","day","start","end"}]
    Function("scheduleAlarms") { json: String ->
      Store.putString(ctx, "alarms", json)
      AlarmScheduler.scheduleAll(ctx)
    }

    // JSON: {"blocked":[pkg], "allowed":[pkg], "friend":[pkg], "endAt": ms, "lessonName": "..."}
    Function("startLock") { json: String ->
      Store.putString(ctx, "lock", json)
      val i = Intent(ctx, LockService::class.java)
      if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
    }

    Function("stopLock") {
      Store.putString(ctx, "lock", "")
      ctx.stopService(Intent(ctx, LockService::class.java))
      LockService.running = false
      Store.flush(ctx)
    }

    // Opens the "studying with a friend" window for the given apps until `untilMs` (epoch ms).
    Function("setFriendWindow") { untilMs: Double ->
      val s = Store.getString(ctx, "lock", "")
      if (s.isNotEmpty()) {
        Store.putString(ctx, "lock", JSONObject(s).put("friendUntil", untilMs.toLong()).toString())
      }
    }

    // Mola: `untilMs`'e kadar hiçbir uygulama kilitlenmez (0 = molayı bitir).
    Function("setBreak") { untilMs: Double ->
      val s = Store.getString(ctx, "lock", "")
      if (s.isNotEmpty()) {
        val o = JSONObject(s)
        val now = System.currentTimeMillis()
        if (untilMs > 0) {
          o.put("breakStartedAt", now)
        } else {
          // Molada geçen süre ders bitiş zamanına eklenir (ders süresi molada akmaz).
          val started = o.optLong("breakStartedAt", 0L)
          val until = o.optLong("breakUntil", 0L)
          if (started > 0L) o.put("endAt", o.optLong("endAt", 0L) + maxOf(0L, minOf(now, until) - started))
          o.put("breakStartedAt", 0L)
        }
        Store.putString(ctx, "lock", o.put("breakUntil", untilMs.toLong()).toString())
      }
    }

    // True if the watcher service has ticked within the last few seconds.
    Function("isLockRunning") {
      LockService.running && System.currentTimeMillis() - Store.getLong(ctx, "lastTick", 0L) < 5000L
    }

    // JSON: {"usage": {pkg: seconds}, "blocks": [{pkg, at}]}
    Function("getUsage") { clear: Boolean -> Store.readUsage(ctx, clear) }
  }
}
