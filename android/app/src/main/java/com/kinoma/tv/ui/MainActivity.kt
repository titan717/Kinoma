package com.kinoma.tv.ui

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.kinoma.tv.data.UpdateChecker
import com.kinoma.tv.data.UpdateInfo
import kotlinx.coroutines.launch
import java.io.InputStream

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private lateinit var fullscreenContainer: FrameLayout

    companion object {
        private const val TAG = "KinomaTV"
        private const val APP_DOMAIN = "appassets.androidplatform.net"
        private const val WEB_ENTRY_URL = "https://$APP_DOMAIN/assets/web/index.html"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on for TV viewing and set full immersion
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        // Root layout
        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#07080d"))
        }

        fullscreenContainer = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            visibility = View.GONE
            setBackgroundColor(Color.BLACK)
        }

        // Configure WebViewAssetLoader to serve bundled web assets securely over HTTPS
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#07080d"))
            isFocusable = true
            isFocusableInTouchMode = true
        }

        configureWebSettings(webView.settings)

        // Add JavaScript bridge for TV and updater integration
        webView.addJavascriptInterface(KinomaTVBridge(this), "KinomaNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url
                if (url.host == APP_DOMAIN) {
                    val path = url.path ?: ""
                    val fileName = path.substringAfterLast('/', "")
                    val hasExtension = fileName.contains('.') && !fileName.endsWith(".html")

                    // If it's a known static asset file (js, css, image, font), let asset loader handle it
                    if (hasExtension || path.endsWith(".html")) {
                        return assetLoader.shouldInterceptRequest(url)
                    }

                    // For client-side SPA routing (e.g. /tv, /watch/:id), serve web/index.html
                    return try {
                        val inputStream: InputStream = assets.open("web/index.html")
                        WebResourceResponse("text/html", "UTF-8", inputStream)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to load SPA fallback index.html for: $path", e)
                        assetLoader.shouldInterceptRequest(url)
                    }
                }
                // External requests (kinomaapi.vercel.app, anilist images, video streams) pass through normally
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                // Guarantee TV mode is active in the web frontend
                view.evaluateJavascript(
                    """
                    (function() {
                        window.isKinomaAndroidTV = true;
                        try {
                            localStorage.setItem('kinoma_tv_mode', 'true');
                            document.documentElement.classList.add('tv-mode');
                        } catch(e) {}
                    })();
                    """.trimIndent(), null
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                fullscreenContainer.addView(view)
                fullscreenContainer.visibility = View.VISIBLE
                webView.visibility = View.GONE
            }

            override fun onHideCustomView() {
                if (customView == null) return
                fullscreenContainer.removeView(customView)
                fullscreenContainer.visibility = View.GONE
                customView = null
                customViewCallback?.onCustomViewHidden()
                webView.visibility = View.VISIBLE
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d("KinomaTVWeb", "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                return true
            }
        }

        rootLayout.addView(webView)
        rootLayout.addView(fullscreenContainer)
        setContentView(rootLayout)

        // Load the bundled production Kinoma TV application
        webView.loadUrl(WEB_ENTRY_URL)
        webView.requestFocus()

        // Background check for updates without blocking TV interface
        checkUpdatesInBackground()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebSettings(settings: WebSettings) {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            displayZoomControls = false
            builtInZoomControls = false
            setSupportZoom(false)

            // Identify as Android TV Leanback environment for automatic TV layout
            val defaultUa = userAgentString
            userAgentString = "$defaultUa KinomaTV/1.0.0 (Android TV; Leanback; SmartTV)"
        }
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
            webView.requestFocus()
        }
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        webView.onResume()
        webView.requestFocus()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Handle Back button for TV remote
        if (event.keyCode == KeyEvent.KEYCODE_BACK) {
            if (event.action == KeyEvent.ACTION_UP) {
                // If in fullscreen video custom view, exit fullscreen
                if (customView != null) {
                    webView.webChromeClient?.onHideCustomView()
                    return true
                }

                // Check if web page can handle back (e.g. details overlay, search, player)
                webView.evaluateJavascript(
                    """
                    (function() {
                        var isWatch = window.location.pathname.indexOf('/watch') !== -1;
                        var escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
                        window.dispatchEvent(escEvent);
                        return isWatch;
                    })();
                    """.trimIndent()
                ) { isWatchResult ->
                    if (isWatchResult == "true") {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        }
                    }
                }
                return true
            }
            return true
        }

        // Forward D-pad and media remote keys to WebView
        return super.dispatchKeyEvent(event)
    }

    private fun checkUpdatesInBackground() {
        lifecycleScope.launch {
            try {
                val update = UpdateChecker.checkForUpdate(this@MainActivity)
                if (update != null && !isFinishing) {
                    showUpdatePrompt(update)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Background update check error: ${e.message}")
            }
        }
    }

    private fun showUpdatePrompt(update: UpdateInfo) {
        val builder = AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
        builder.setTitle("Kinoma TV Update")
        builder.setMessage("A new version (${update.latestVersionName}) is available.\n\n${update.releaseNotes}")

        builder.setPositiveButton("Update Now") { dialog, _ ->
            dialog.dismiss()
            startDownloadAndInstall(update)
        }

        if (!update.mandatory) {
            builder.setNegativeButton("Later") { dialog, _ ->
                dialog.dismiss()
            }
        }

        builder.setCancelable(!update.mandatory)
        val alert = builder.create()
        alert.show()
    }

    private fun startDownloadAndInstall(update: UpdateInfo) {
        val progressDialog = AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("Downloading Update")
            .setView(ProgressBar(this).apply { isIndeterminate = false; max = 100 })
            .setMessage("Downloading Kinoma TV update...")
            .setCancelable(false)
            .create()

        progressDialog.show()

        UpdateChecker.downloadAndInstall(
            context = this,
            apkUrl = update.apkUrl,
            expectedSha256 = update.sha256,
            onProgress = { percent ->
                runOnUiThread {
                    progressDialog.setMessage("Downloading: $percent%")
                }
            },
            onSuccess = {
                runOnUiThread {
                    progressDialog.dismiss()
                }
            },
            onError = { error ->
                runOnUiThread {
                    progressDialog.dismiss()
                    AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                        .setTitle("Update Failed")
                        .setMessage(error)
                        .setPositiveButton("OK", null)
                        .show()
                }
            }
        )
    }

    inner class KinomaTVBridge(private val context: Context) {
        @JavascriptInterface
        fun getAppVersion(): String {
            return try {
                val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                pInfo.versionName ?: "1.0.0"
            } catch (e: Exception) {
                "1.0.0"
            }
        }

        @JavascriptInterface
        fun isTV(): Boolean {
            return true
        }

        @JavascriptInterface
        fun checkForUpdates() {
            runOnUiThread {
                checkUpdatesInBackground()
            }
        }
    }
}
