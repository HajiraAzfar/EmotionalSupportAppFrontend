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
import java.util.Calendar

/**
 * The daily reminder: one local notification a day at the time the user chose.
 * No server, no push token, and the words never mention anything written.
 * The chosen time lives in SharedPreferences so a reboot can set it again.
 */
object ReminderScheduler {
  private const val PREFS = "mind_doc_reminder"
  private const val KEY_MINUTES = "minutes_of_day"
  private const val CHANNEL_ID = "daily_reminder"
  private const val REQUEST_CODE = 4201
  private const val NOTIFICATION_ID = 4201

  fun scheduledAt(context: Context): Int =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_MINUTES, -1)

  fun schedule(context: Context, minutesOfDay: Int) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putInt(KEY_MINUTES, minutesOfDay)
        .apply()
    arm(context, minutesOfDay)
  }

  fun cancel(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_MINUTES).apply()
    alarms(context).cancel(alarmIntent(context))
  }

  /** Sets the alarm again from what was saved (after a reboot or an update). */
  fun restore(context: Context) {
    val minutes = scheduledAt(context)
    if (minutes >= 0) {
      arm(context, minutes)
    }
  }

  // ponytail: an inexact daily alarm, so it can arrive some minutes late; an
  // exact alarm needs the SCHEDULE_EXACT_ALARM permission, which a gentle
  // nudge does not justify.
  private fun arm(context: Context, minutesOfDay: Int) {
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
            alarmIntent(context),
        )
  }

  fun show(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
          NotificationChannel(CHANNEL_ID, "Daily reminder", NotificationManager.IMPORTANCE_DEFAULT)
      channel.description = "A gentle daily reminder to take a moment for yourself."
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    val open =
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    val tap =
        PendingIntent.getActivity(
            context,
            REQUEST_CODE,
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
            .setContentTitle("A moment for yourself")
            .setContentText("Whenever you are ready, Mind Doc is here.")
            .setContentIntent(tap)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(publicVersion)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
    NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
  }

  private fun alarms(context: Context) = context.getSystemService(AlarmManager::class.java)

  private fun alarmIntent(context: Context): PendingIntent =
      PendingIntent.getBroadcast(
          context,
          REQUEST_CODE,
          Intent(context, ReminderReceiver::class.java),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
}
