package expo.modules.planimlock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.provider.Settings
import org.json.JSONObject

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return
    val alarm = try { AlarmScheduler.find(context, id) } catch (_: Throwable) { null } ?: return
    // Keep the weekly repeat going.
    try { AlarmScheduler.scheduleOne(context, alarm, System.currentTimeMillis() + 60_000L) } catch (_: Throwable) { }
    fire(context, alarm)
  }

  companion object {
    const val CHANNEL = "planim_lesson_alarm_v1"

    fun activityIntent(ctx: Context, alarm: JSONObject): Intent =
      Intent(ctx, AlarmActivity::class.java)
        .putExtra("id", alarm.getString("id"))
        .putExtra("name", alarm.optString("name", "Ders"))
        .putExtra("start", alarm.optString("start", ""))
        .putExtra("end", alarm.optString("end", ""))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

    fun fire(ctx: Context, alarm: JSONObject) {
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      var channelId = CHANNEL
      if (Build.VERSION.SDK_INT >= 26) {
        val chosen = Store.getString(ctx, "alarmSound", "")
        val sound = if (chosen.isNotEmpty()) android.net.Uri.parse(chosen) else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        // Kanal sesi sonradan değişmediği için her ses ayrı kanal kimliği alır.
        channelId = CHANNEL + "_" + chosen.hashCode()
        val channel = NotificationChannel(channelId, "Ders alarmı", NotificationManager.IMPORTANCE_HIGH)
        channel.setSound(
          sound,
          AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build(),
        )
        channel.enableVibration(true)
        channel.vibrationPattern = longArrayOf(0, 600, 300, 600, 300, 600)
        channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(channel)
      }
      val act = activityIntent(ctx, alarm)
      val pi = PendingIntent.getActivity(
        ctx, alarm.getString("id").hashCode(), act,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(ctx, channelId) else @Suppress("DEPRECATION") Notification.Builder(ctx)
      builder
        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
        .setContentTitle("${alarm.optString("name", "Ders")} başlıyor!")
        .setContentText("Ders vakti geldi. Hazırsan başla.")
        .setCategory(Notification.CATEGORY_ALARM)
        .setAutoCancel(true)
        .setContentIntent(pi)
        .setFullScreenIntent(pi, true)
      if (Build.VERSION.SDK_INT < 26) {
        @Suppress("DEPRECATION")
        builder.setPriority(Notification.PRIORITY_MAX)
      }
      nm.notify(alarm.getString("id").hashCode(), builder.build())

      // Direct launch (works when the "display over other apps" permission was granted).
      try {
        if (Settings.canDrawOverlays(ctx)) ctx.startActivity(act)
      } catch (_: Throwable) { }
    }
  }
}
