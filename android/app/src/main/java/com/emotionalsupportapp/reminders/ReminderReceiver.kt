package com.emotionalsupportapp.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** A slot's daily alarm went off: show that slot's reminder. */
class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val slot = intent.getStringExtra(ReminderScheduler.EXTRA_SLOT) ?: return
    if (ReminderScheduler.isSlot(slot)) {
      ReminderScheduler.show(context, slot)
    }
  }
}

/** Alarms do not survive a reboot or an app update; set them again. */
class ReminderRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
        intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
      ReminderScheduler.restore(context)
    }
  }
}
