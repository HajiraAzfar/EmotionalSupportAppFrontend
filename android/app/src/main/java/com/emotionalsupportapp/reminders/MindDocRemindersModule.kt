package com.emotionalsupportapp.reminders

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** The JS side of the daily reminder (src/specs/NativeMindDocReminders.ts). */
class MindDocRemindersModule(reactContext: ReactApplicationContext) :
    NativeMindDocRemindersSpec(reactContext) {

  override fun getName() = NAME

  override fun schedule(slot: String, minutesOfDay: Double, promise: Promise) {
    val minutes = minutesOfDay.toInt()
    if (!ReminderScheduler.isSlot(slot) || minutes !in 0 until 24 * 60) {
      promise.reject("E_TIME", "A reminder is a slot and minutes after midnight.")
      return
    }
    ReminderScheduler.schedule(reactApplicationContext, slot, minutes)
    promise.resolve(null)
  }

  override fun cancel(slot: String, promise: Promise) {
    if (ReminderScheduler.isSlot(slot)) {
      ReminderScheduler.cancel(reactApplicationContext, slot)
    }
    promise.resolve(null)
  }

  override fun markDone(slot: String, localDate: String, promise: Promise) {
    if (ReminderScheduler.isSlot(slot) && DATE.matches(localDate)) {
      ReminderScheduler.markDone(reactApplicationContext, slot, localDate)
    }
    promise.resolve(null)
  }

  override fun scheduleOnce(key: String, atMillis: Double, promise: Promise) {
    if (key.isBlank() || key.length > 64 || atMillis <= System.currentTimeMillis()) {
      promise.reject("E_TIME", "A one-off reminder needs a key and a time still to come.")
      return
    }
    ReminderScheduler.scheduleOnce(reactApplicationContext, key, atMillis.toLong())
    promise.resolve(null)
  }

  override fun cancelOnce(key: String, promise: Promise) {
    ReminderScheduler.cancelOnce(reactApplicationContext, key)
    promise.resolve(null)
  }

  override fun scheduledAt(slot: String, promise: Promise) {
    val minutes = if (ReminderScheduler.isSlot(slot)) ReminderScheduler.scheduledAt(reactApplicationContext, slot) else -1
    promise.resolve(minutes.toDouble())
  }

  companion object {
    const val NAME = "MindDocReminders"
    private val DATE = Regex("""\d{4}-\d{2}-\d{2}""")
  }
}

class MindDocRemindersPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == MindDocRemindersModule.NAME) MindDocRemindersModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
        MindDocRemindersModule.NAME to
            ReactModuleInfo(
                MindDocRemindersModule.NAME,
                MindDocRemindersModule.NAME,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                true, // isTurboModule
            ))
  }
}
