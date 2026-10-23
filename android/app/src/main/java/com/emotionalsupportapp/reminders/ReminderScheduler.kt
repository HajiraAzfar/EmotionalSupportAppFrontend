package com.emotionalsupportapp.reminders

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.emotionalsupportapp.R
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * The check-in reminders: one local notification a day per slot (morning,
 * afternoon, evening), each at the time the user chose, each on or off. No
 * server, no push token, and the words never mention anything written. The
 * times live in SharedPreferences so a reboot can set them again.
 */
object ReminderScheduler {
  private const val PREFS = "mind_doc_reminder"
  private const val CHANNEL_ID = "daily_reminder"
  const val EXTRA_SLOT = "slot"

  // Each slot's own alarm and notification ids, so they never replace each other.
  private val SLOTS = listOf("morning", "afternoon", "evening")
  private val TITLES =
      mapOf(
          "morning" to "Your morning check-in",
          "afternoon" to "Your afternoon check-in",
          "evening" to "Your evening check-in",
      )

  // The single daily reminder from before slots: cleared on the first restore.
  private const val LEGACY_KEY = "minutes_of_day"
  private const val LEGACY_REQUEST = 4201

  private fun key(slot: String) = "minutes_$slot"

  // The latest day (yyyy-MM-dd) that slot's check-in was finished.
  private fun doneKey(slot: String) = "done_$slot"

  private fun requestCode(slot: String) = 4211 + SLOTS.indexOf(slot)

  fun isSlot(slot: String) = slot in SLOTS

  // Every reminder time sits inside its slot's window, so the day a reminder
  // fires on is the day its check-in belongs to.
  private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  /**
   * A check-in finished for [localDate]: that day's reminder stays quiet, and
   * one already showing is taken away. Only a later day replaces the one kept,
   * so adding yesterday's check-in never wakes today's reminder again.
   */
  fun markDone(context: Context, slot: String, localDate: String) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (localDate > (prefs.getString(doneKey(slot), "") ?: "")) {
      prefs.edit().putString(doneKey(slot), localDate).apply()
    }
    if (localDate == today()) {
      NotificationManagerCompat.from(context).cancel(requestCode(slot))
    }
  }

  private fun doneToday(context: Context, slot: String) =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(doneKey(slot), null) == today()

  fun scheduledAt(context: Context, slot: String): Int =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(key(slot), -1)

  fun schedule(context: Context, slot: String, minutesOfDay: Int) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putInt(key(slot), minutesOfDay)
        .apply()
    arm(context, slot, minutesOfDay)
  }

  fun cancel(context: Context, slot: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(key(slot)).apply()
    alarms(context).cancel(alarmIntent(context, slot))
  }

  /** Sets every alarm again from what was saved (after a reboot or an update). */
  fun restore(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (prefs.contains(LEGACY_KEY)) {
      prefs.edit().remove(LEGACY_KEY).apply()
      alarms(context)
          .cancel(
              PendingIntent.getBroadcast(
                  context,
                  LEGACY_REQUEST,
                  Intent(context, ReminderReceiver::class.java),
                  PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
              ))
    }
    for (slot in SLOTS) {
      val minutes = scheduledAt(context, slot)
      if (minutes >= 0) {
        arm(context, slot, minutes)
      }
    }
  }

  // ponytail: inexact daily alarms, so one can arrive some minutes late; exact
  // alarms need the SCHEDULE_EXACT_ALARM permission, which a gentle nudge does
  // not justify.
  private fun arm(context: Context, slot: String, minutesOfDay: Int) {
    val next =
        Calendar.getInstance().apply {
          set(Calendar.HOUR_OF_DAY, minutesOfDay / 60)
          set(Calendar.MINUTE, minutesOfDay % 60)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
          if (timeInMillis <= System.currentTimeMillis()) {
            add(Calendar.DAY_OF_YEAR, 1)
          }
        }
    alarms(context)
        .setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            next.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            alarmIntent(context, slot),
        )
  }

  fun show(context: Context, slot: String) {
    if (doneToday(context, slot)) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
          NotificationChannel(CHANNEL_ID, "Check-in reminders", NotificationManager.IMPORTANCE_DEFAULT)
      channel.description = "A gentle reminder when a check-in opens."
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    val open =
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    val tap =
        PendingIntent.getActivity(
            context,
            requestCode(slot),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    // On the lock screen only the neutral public version shows.
    val publicVersion =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_reminder)
            .setContentTitle("Reminder")
            .build()
    val notification =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_reminder)
            .setContentTitle(TITLES[slot] ?: "A moment for yourself")
            .setContentText("A minute or two, whenever you're ready.")
            .setContentIntent(tap)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(publicVersion)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
    NotificationManagerCompat.from(context).notify(requestCode(slot), notification)
  }

  private fun alarms(context: Context) = context.getSystemService(AlarmManager::class.java)

  private fun alarmIntent(context: Context, slot: String): PendingIntent =
      PendingIntent.getBroadcast(
          context,
          requestCode(slot),
          Intent(context, ReminderReceiver::class.java).putExtra(EXTRA_SLOT, slot),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
}
