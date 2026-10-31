package expo.modules.planimlock

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** Weekly lesson alarms. AlarmManager has no repeat for alarm clocks, so each firing schedules the next week. */
object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.planimlock.ALARM_FIRE"

  /** day: 0 = Monday … 6 = Sunday (same as the JS side). */
  fun nextTrigger(day: Int, start: String, after: Long): Long {
    val parts = start.split(":")
    val hour = parts[0].toInt()
    val minute = parts[1].toInt()
    val target = if (day == 6) Calendar.SUNDAY else day + 2
    for (i in 0..8) {
      val c = Calendar.getInstance()
      c.timeInMillis = after
      c.add(Calendar.DAY_OF_YEAR, i)
      c.set(Calendar.HOUR_OF_DAY, hour)
      c.set(Calendar.MINUTE, minute)
      c.set(Calendar.SECOND, 0)
      c.set(Calendar.MILLISECOND, 0)
      if (c.get(Calendar.DAY_OF_WEEK) == target && c.timeInMillis > after) return c.timeInMillis
    }
    return after + 7L * 24 * 3600 * 1000
  }

  private fun pending(ctx: Context, id: String): PendingIntent {
    val intent = Intent(ctx, AlarmReceiver::class.java)
      .setAction(ACTION_FIRE)
      .setData(Uri.parse("planim-alarm://$id"))
      .putExtra("id", id)
    return PendingIntent.getBroadcast(ctx, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun scheduleOne(ctx: Context, alarm: JSONObject, after: Long) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val at = nextTrigger(alarm.getInt("day"), alarm.getString("start"), after)
    val open = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: Intent()
    val show = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    am.setAlarmClock(AlarmManager.AlarmClockInfo(at, show), pending(ctx, alarm.getString("id")))
  }

  fun scheduleAll(ctx: Context) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    try {
      val old = JSONArray(Store.getString(ctx, "scheduled_ids", "[]"))
      for (i in 0 until old.length()) am.cancel(pending(ctx, old.getString(i)))
    } catch (_: Throwable) { }
    val ids = JSONArray()
    val now = System.currentTimeMillis()
    try {
      val arr = JSONArray(Store.getString(ctx, "alarms", "[]"))
      for (i in 0 until arr.length()) {
        val o = arr.getJSONObject(i)
        try {
          scheduleOne(ctx, o, now)
          ids.put(o.getString("id"))
        } catch (_: Throwable) { }
      }
    } catch (_: Throwable) { }
    Store.putString(ctx, "scheduled_ids", ids.toString())
  }

  fun find(ctx: Context, id: String): JSONObject? {
    val arr = JSONArray(Store.getString(ctx, "alarms", "[]"))
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (o.getString("id") == id) return o
    }
    return null
  }
}
