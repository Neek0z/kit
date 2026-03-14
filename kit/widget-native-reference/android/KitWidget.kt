package com.kit.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONArray

class KitWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        const val PREFS_NAME = "KitWidgetData"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val count = prefs.getInt("followUpCount", 0)
            val contactsJson = prefs.getString("followUpContacts", "[]") ?: "[]"
            val contacts = JSONArray(contactsJson)

            val views = RemoteViews(context.packageName, R.layout.kit_widget)
            views.setTextViewText(
                R.id.widget_count,
                if (count == 0) "✓ Tout est à jour" else "$count à relancer"
            )
            val line1 = if (contacts.length() > 0) contacts.getJSONObject(0).optString("full_name", "") else ""
            val line2 = if (contacts.length() > 1) contacts.getJSONObject(1).optString("full_name", "") else ""
            val line3 = if (contacts.length() > 2) "+ ${contacts.length() - 2} autres" else ""
            views.setTextViewText(R.id.contact_1, line1)
            views.setTextViewText(R.id.contact_2, line2)
            views.setTextViewText(R.id.contact_3, line3)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
