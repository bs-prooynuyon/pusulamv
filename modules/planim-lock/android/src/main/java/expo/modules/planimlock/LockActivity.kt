package expo.modules.planimlock

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.TextView
import org.json.JSONObject

/** Shown on top of a blocked app. Back is disabled; the only way out is back to Pusulam. */
class LockActivity : Activity() {
  private val handler = Handler(Looper.getMainLooper())
  private var countdown: TextView? = null

  private val tick = object : Runnable {
    override fun run() {
      val end = endAt()
      val left = (end - System.currentTimeMillis()) / 1000
      if (left <= 0) { finish(); return }
      countdown?.text = String.format("%02d:%02d:%02d", left / 3600, (left % 3600) / 60, left % 60)
      handler.postDelayed(this, 1000)
    }
  }

  private fun endAt(): Long = try {
    JSONObject(Store.getString(this, "lock", "{}")).optLong("endAt", 0L)
  } catch (_: Throwable) { 0L }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val pkg = intent.getStringExtra("pkg") ?: ""
    val label = try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString() } catch (_: Throwable) { "Bu uygulama" }
    val lesson = try { JSONObject(Store.getString(this, "lock", "{}")).optString("lessonName", "Ders") } catch (_: Throwable) { "Ders" }

    val root = Ui.root(this)
    root.addView(Ui.text(this, "ÇALIŞMA MODU", 13f, Ui.PINK, true))
    root.addView(Ui.text(this, "$label şimdi kapalı", 28f, Ui.TEXT, true))
    root.addView(Ui.text(this, "$lesson dersi devam ediyor. Ders bitince açılır.", 15f, Ui.MUTED))
    val clock = Ui.text(this, "", 44f, Ui.TEXT, true)
    countdown = clock
    root.addView(clock)
    root.addView(Ui.spacer(this, 20))
    root.addView(Ui.button(this, "Pusulam'a dön", Ui.PINK) {
      packageManager.getLaunchIntentForPackage(packageName)?.let {
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        startActivity(it)
      }
      finish()
    })
    setContentView(root)
  }

  override fun onResume() { super.onResume(); handler.post(tick) }
  override fun onPause() { handler.removeCallbacks(tick); super.onPause() }

  @Deprecated("Back is disabled")
  override fun onBackPressed() { /* stay locked */ }
}
