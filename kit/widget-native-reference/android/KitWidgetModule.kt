package com.kit.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class KitWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KitWidgetModule"

    @ReactMethod
    fun updateData(json: String) {
        val context = reactApplicationContext.applicationContext
        val prefs = context.getSharedPreferences(KitWidget.PREFS_NAME, Context.MODE_PRIVATE)
        try {
            val obj = org.json.JSONObject(json)
            prefs.edit()
                .putInt("followUpCount", obj.optInt("count", 0))
                .putString("followUpContacts", obj.optJSONArray("contacts")?.toString() ?: "[]")
                .apply()
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(android.content.ComponentName(context, KitWidget::class.java))
            if (ids.isNotEmpty()) {
                for (id in ids) KitWidget.updateAppWidget(context, manager, id)
            }
        } catch (_: Exception) {}
    }
}
