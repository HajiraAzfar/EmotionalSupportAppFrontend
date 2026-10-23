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

  override fun schedule(minutesOfDay: Double, promise: Promise) {
    val minutes = minutesOfDay.toInt()
    if (minutes !in 0 until 24 * 60) {
      promise.reject("E_TIME", "A reminder time is minutes after midnight.")
      return
    }
    ReminderScheduler.schedule(reactApplicationContext, minutes)
    promise.resolve(null)
  }

  override fun cancel(promise: Promise) {
    ReminderScheduler.cancel(reactApplicationContext)
    promise.resolve(null)
  }

  override fun scheduledAt(promise: Promise) {
    promise.resolve(ReminderScheduler.scheduledAt(reactApplicationContext).toDouble())
  }

  companion object {
    const val NAME = "MindDocReminders"
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
