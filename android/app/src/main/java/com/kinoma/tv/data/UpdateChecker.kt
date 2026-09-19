package com.kinoma.tv.data

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import java.io.File

object UpdateChecker {
    private const val UPDATE_JSON_URL = "https://ais-dev-ldac4dfys5uh24kepg3akw-880382000432.asia-east1.run.app/tv/update.json"

    suspend fun checkForUpdate(): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val client = OkHttpClient()
            val request = Request.Builder().url(UPDATE_JSON_URL).build()
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext null
            val updateInfo = Gson().fromJson(body, UpdateInfo::class.java)
            if (updateInfo.latestVersionCode > 1) { // Current app version code is 1
                return@withContext updateInfo
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    fun downloadAndInstall(context: Context, apkUrl: String) {
        try {
            val destination = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Kinoma-TV.apk")
            if (destination.exists()) destination.delete()

            val request = DownloadManager.Request(Uri.parse(apkUrl))
                .setTitle("Kinoma TV Update")
                .setDescription("Downloading latest APK...")
                .setDestinationUri(Uri.fromFile(destination))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = manager.enqueue(request)

            // Register broadcast receiver for download completion
            val onComplete = object : BroadcastReceiver() {
                override fun onReceive(ctxt: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (downloadId == id) {
                        val apkUri = FileProvider.getUriForFile(
                            ctxt,
                            "${ctxt.packageName}.fileprovider",
                            destination
                        )
                        val installIntent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(apkUri, "application/vnd.android.package-archive")
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        ctxt.startActivity(installIntent)
                        try {
                            ctxt.unregisterReceiver(this)
                        } catch (_: Exception) {}
                    }
                }
            }
            context.registerReceiver(onComplete, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
