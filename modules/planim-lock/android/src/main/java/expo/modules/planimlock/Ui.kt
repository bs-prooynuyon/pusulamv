package expo.modules.planimlock

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/** Small helpers so the native screens need no XML resources. */
object Ui {
  const val BG = 0xFF241B2E.toInt()
  const val TEXT = 0xFFF3E9F7.toInt()
  const val MUTED = 0xFFA28FAF.toInt()
  const val PINK = 0xFF2F6FDE.toInt()
  const val CORAL = 0xFFF0654F.toInt()
  const val CARD = 0xFF2E2438.toInt()

  fun dp(ctx: Context, v: Int): Int = (v * ctx.resources.displayMetrics.density).toInt()

  fun root(ctx: Context): LinearLayout = LinearLayout(ctx).apply {
    orientation = LinearLayout.VERTICAL
    gravity = Gravity.CENTER
    setBackgroundColor(BG)
    val p = dp(ctx, 28)
    setPadding(p, p, p, p)
  }

  fun text(ctx: Context, value: String, sizeSp: Float, color: Int = TEXT, bold: Boolean = false): TextView = TextView(ctx).apply {
    text = value
    textSize = sizeSp
    setTextColor(color)
    gravity = Gravity.CENTER
    if (bold) setTypeface(typeface, Typeface.BOLD)
    setPadding(0, dp(ctx, 6), 0, dp(ctx, 6))
  }

  fun button(ctx: Context, label: String, fill: Int, textColor: Int = Color.WHITE, onClick: () -> Unit): Button = Button(ctx).apply {
    text = label
    isAllCaps = false
    textSize = 17f
    setTextColor(textColor)
    background = GradientDrawable().apply {
      setColor(fill)
      cornerRadius = dp(ctx, 16).toFloat()
    }
    setOnClickListener { onClick() }
    layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(ctx, 54)).apply {
      topMargin = dp(ctx, 12)
    }
  }

  fun spacer(ctx: Context, h: Int): View = View(ctx).apply {
    layoutParams = LinearLayout.LayoutParams(1, dp(ctx, h))
  }
}
