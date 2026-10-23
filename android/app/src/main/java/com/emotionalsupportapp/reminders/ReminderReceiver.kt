package com.emotionalsupportapp.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** The daily alarm went off: show the reminder. */
class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    ReminderScheduler.show(context)
  }
}

/** Alarms do not survive a reboot or an app update; set it again. */
class ReminderRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
        intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
      ReminderScheduler.restore(context)
    }
  }
}
