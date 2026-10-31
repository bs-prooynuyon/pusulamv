package expo.modules.planimlock

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Tiny persistent store shared by the module, the service and the receivers (all run in the app process). */
object Store {
  private const val PREFS = "planim_lock"
  private val usage = HashMap<String, Long>()
  private var blocks = JSONArray()
  private var loaded = false
  private var dirty = 0

  private fun prefs(ctx: Context) = ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun getString(ctx: Context, key: String, def: String): String = prefs(ctx).getString(key, def) ?: def
  fun putString(ctx: Context, key: String, value: String) { prefs(ctx).edit().putString(key, value).apply() }
  fun getLong(ctx: Context, key: String, def: Long): Long = prefs(ctx).getLong(key, def)
  fun putLong(ctx: Context, key: String, value: Long) { prefs(ctx).edit().putLong(key, value).apply() }

  @Synchronized private fun load(ctx: Context) {
    if (loaded) return
    loaded = true
    try {
      val u = JSONObject(getString(ctx, "usage", "{}"))
      u.keys().forEach { usage[it] = u.getLong(it) }
      blocks = JSONArray(getString(ctx, "blocks", "[]"))
    } catch (_: Throwable) { }
  }

  @Synchronized private fun persist(ctx: Context) {
    val u = JSONObject()
    usage.forEach { (k, v) -> u.put(k, v) }
    prefs(ctx).edit().putString("usage", u.toString()).putString("blocks", blocks.toString()).apply()
    dirty = 0
  }

  @Synchronized fun addUsage(ctx: Context, pkg: String) {
    load(ctx)
    usage[pkg] = (usage[pkg] ?: 0L) + 1L
    if (++dirty >= 10) persist(ctx)
  }

  @Synchronized fun addBlock(ctx: Context, pkg: String) {
    load(ctx)
    blocks.put(JSONObject().put("pkg", pkg).put("at", System.currentTimeMillis()))
    persist(ctx)
  }

  @Synchronized fun flush(ctx: Context) { load(ctx); persist(ctx) }

  /** Returns {"usage": {pkg: seconds}, "blocks": [{pkg, at}]} and optionally resets it. */
  @Synchronized fun readUsage(ctx: Context, clear: Boolean): String {
    load(ctx)
    val u = JSONObject()
    usage.forEach { (k, v) -> u.put(k, v) }
    val result = JSONObject().put("usage", u).put("blocks", JSONArray(blocks.toString())).toString()
    if (clear) {
      usage.clear()
      blocks = JSONArray()
      persist(ctx)
    }
    return result
  }
}
