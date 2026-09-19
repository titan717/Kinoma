package com.kinoma.tv

import android.app.Application

class KinomaTvApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: KinomaTvApplication
            private set
    }
}
