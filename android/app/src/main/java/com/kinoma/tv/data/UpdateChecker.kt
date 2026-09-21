package com.kinoma.tv.data

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import com.kinoma.tv.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import com.google.gson.Gson
import java.io.File

object UpdateChecker {
    // Configurable stable endpoint
    private const val UPDATE_JSON_URL = "https://raw.githubusercontent.com/titan717/Kinoma/main/update/latest.json"

    suspend fun checkForUpdate(): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val client = OkHttpClient()
            val request = Request.Builder().url(UPDATE_JSON_URL).build()
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val body = response.body?.string() ?: return@withContext null
            
            val trimmedBody = body.trim()
            if (!trimmedBody.startsWith("{") && !trimmedBody.startsWith("[")) {
                return@withContext null
            }
            
            val updateInfo = Gson().fromJson(trimmedBody, UpdateInfo::class.java)
            
            // Compare version code
            if (updateInfo.latestVersionCode > BuildConfig.VERSION_CODE) {
                return@withContext updateInfo
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    fun downloadAndInstall(context: Context, apkUrl: String, expectedSha256: String, onProgress: (Int) -> Unit, onComplete: () -> Unit, onError: (String) -> Unit) {
        try {
            val destination = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Kinoma-TV.apk")
            if (destination.exists()) destination.delete()

            val request = DownloadManager.Request(Uri.parse(apkUrl))
                .setTitle("Kinoma TV Update")
                .setDescription("Downloading...")
                .setDestinationUri(Uri.fromFile(destination))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = manager.enqueue(request)

            // Track progress
            Thread {
                val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
                var downloading = true
                while (downloading) {
                    val query = DownloadManager.Query().setFilterById(downloadId)
                    val cursor = manager.query(query)
                    if (cursor.moveToFirst()) {
                        val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            downloading = false
                            
                            // Verify SHA-256
                            if (verifySha256(destination, expectedSha256)) {
                                mainHandler.post { onComplete() }
                            } else {
                                destination.delete()
                                mainHandler.post { onError("Update verification failed.") }
                            }
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            downloading = false
                            mainHandler.post { onError("Download failed.") }
                        } else if (status == DownloadManager.STATUS_RUNNING) {
                            val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                            val soFar = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                            if (total > 0) {
                                val progress = ((soFar * 100) / total).toInt()
                                mainHandler.post { onProgress(progress) }
                            }
                        }
                    }
                    cursor.close()
                    Thread.sleep(1000)
                }
            }.start()

            // Broadcast receiver for installation
            val onCompleteReceiver = object : BroadcastReceiver() {
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
            context.registerReceiver(onCompleteReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED)
        } catch (e: Exception) {
            e.printStackTrace()
            onError(e.message ?: "Download failed.")
        }
    }

    private fun verifySha256(file: File, expectedSha256: String): Boolean {
        return try {
            val digest = java.security.MessageDigest.getInstance("SHA-256")
            file.inputStream().use { inputStream ->
                val buffer = ByteArray(8192)
                var bytesRead: Int
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    digest.update(buffer, 0, bytesRead)
                }
            }
            val hash = digest.digest().joinToString("") { "%02x".format(it) }
            hash.equals(expectedSha256, ignoreCase = true)
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
