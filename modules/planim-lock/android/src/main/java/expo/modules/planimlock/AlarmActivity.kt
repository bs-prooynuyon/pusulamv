package expo.modules.planimlock

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.WindowManager

/** Full-screen lesson alarm. Shows over the lock screen, rings until the student answers. */
class AlarmActivity : Activity() {
  private var ringtone: Ringtone? = null
  private var vibrator: Vibrator? = null
  private val handler = Handler(Looper.getMainLooper())
  private var lessonId = ""

  @Suppress("DEPRECATION")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= 27) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).requestDismissKeyguard(this, null)
    } else {
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    lessonId = intent.getStringExtra("id") ?: ""
    val name = intent.getStringExtra("name") ?: "Ders"
    val start = intent.getStringExtra("start") ?: ""
    val end = intent.getStringExtra("end") ?: ""

    val root = Ui.root(this)
    root.addView(Ui.text(this, "DERS VAKTİ", 13f, Ui.CORAL, true))
    root.addView(Ui.text(this, name, 34f, Ui.TEXT, true))
    if (start.isNotEmpty()) root.addView(Ui.text(this, "$start – $end", 16f, Ui.MUTED))
    root.addView(Ui.spacer(this, 24))
    root.addView(Ui.button(this, "Başladım", Ui.PINK) { begin() })
    root.addView(Ui.button(this, "Kapat", Ui.CARD, Ui.TEXT) { stopAlarm(); finish() })
    setContentView(root)

    (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(lessonId.hashCode())
    startRinging()
    handler.postDelayed({ stopAlarm(); finish() }, 90_000L)
  }

  @Suppress("DEPRECATION")
  private fun startRinging() {
    try {
      val chosen = Store.getString(this, "alarmSound", "")
      val uri = (if (chosen.isNotEmpty()) Uri.parse(chosen) else null)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      ringtone = RingtoneManager.getRingtone(this, uri)?.apply {
        audioAttributes = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        if (Build.VERSION.SDK_INT >= 28) isLooping = true
        play()
      }
    } catch (_: Throwable) { }
    try {
      vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      val pattern = longArrayOf(0, 600, 300, 600, 300, 600)
      if (Build.VERSION.SDK_INT >= 26) vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
      else vibrator?.vibrate(pattern, 0)
    } catch (_: Throwable) { }
  }

  private fun stopAlarm() {
    handler.removeCallbacksAndMessages(null)
    try { ringtone?.stop() } catch (_: Throwable) { }
    try { vibrator?.cancel() } catch (_: Throwable) { }
  }

  private fun begin() {
    stopAlarm()
    try {
      val open = Intent(Intent.ACTION_VIEW, Uri.parse("planim://lesson-start?id=" + Uri.encode(lessonId)))
        .setPackage(packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      startActivity(open)
    } catch (_: Throwable) { }
    finish()
  }

  override fun onDestroy() {
    stopAlarm()
    super.onDestroy()
  }

  @Deprecated("Back is disabled while the alarm rings")
  override fun onBackPressed() { /* must answer the alarm */ }
}
