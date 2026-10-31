package expo.modules.planimlock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try { AlarmScheduler.scheduleAll(context) } catch (_: Throwable) { }
  }
}
