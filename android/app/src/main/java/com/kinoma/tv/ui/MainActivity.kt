package com.kinoma.tv.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.*
import coil.compose.AsyncImage
import com.kinoma.tv.data.*
import com.kinoma.tv.ui.theme.KinomaTVTheme
import kotlinx.coroutines.launch

@OptIn(ExperimentalTvMaterial3Api::class)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            KinomaTVTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    shape = RoundedCornerShape(0.dp)
                ) {
                    TVHomeScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TVHomeScreen() {
    var trendingList by remember { mutableStateOf<List<AnimeItem>>(emptyList()) }
    var popularList by remember { mutableStateOf<List<AnimeItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var updateInfo by remember { mutableStateOf<UpdateInfo?>(null) }
    var showUpdateDialog by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current

    LaunchedEffect(Unit) {
        // Check for updates
        scope.launch {
            val update = UpdateChecker.checkForUpdate()
            if (update != null) {
                updateInfo = update
                showUpdateDialog = true
            }
        }

        try {
            isLoading = true
            val tRes = KinomaApiService.instance.getTrending()
            val pRes = KinomaApiService.instance.getPopular()
            trendingList = tRes.results ?: emptyList()
            popularList = pRes.results ?: emptyList()
            isLoading = false
        } catch (e: Exception) {
            errorMessage = e.localizedMessage ?: "Failed to load catalog"
            isLoading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF07080d))) {
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                androidx.tv.material3.Text("Loading...")
            }
        } else if (errorMessage != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Error: $errorMessage", color = Color.Red)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = {
                        scope.launch {
                            isLoading = true
                            errorMessage = null
                            try {
                                trendingList = KinomaApiService.instance.getTrending().results ?: emptyList()
                                popularList = KinomaApiService.instance.getPopular().results ?: emptyList()
                            } catch (e: Exception) {
                                errorMessage = e.localizedMessage
                            } finally {
                                isLoading = false
                            }
                        }
                    }) {
                        Text("Retry")
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(48.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Kinoma TV",
                        style = MaterialTheme.typography.displayMedium,
                        color = Color.White
                    )
                    
                    var isManualChecking by remember { mutableStateOf(false) }
                    
                    Button(
                        onClick = {
                            isManualChecking = true
                            scope.launch {
                                val update = UpdateChecker.checkForUpdate()
                                if (update != null) {
                                    updateInfo = update
                                    showUpdateDialog = true
                                } else {
                                    // Could show a toast, but this is simple.
                                }
                                isManualChecking = false
                            }
                        },
                        enabled = !isManualChecking
                    ) {
                        Text(if (isManualChecking) "Checking..." else "Check for Updates")
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "Trending Anime",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(0xFFc084fc)
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Horizontal list of trending anime
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(trendingList.size) { index ->
                        val anime = trendingList[index]
                        Card(
                            onClick = {
                                val intent = Intent(context, PlayerActivity::class.java).apply {
                                    putExtra("anime_title", anime.displayTitle)
                                }
                                context.startActivity(intent)
                            },
                            modifier = Modifier
                                .width(180.dp)
                                .height(260.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize()) {
                                AsyncImage(
                                    model = anime.image,
                                    contentDescription = anime.displayTitle,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = anime.displayTitle,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.White,
                                    maxLines = 1,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Native TV Update Dialog Overlay
        if (showUpdateDialog && updateInfo != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.8f)),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    modifier = Modifier
                        .width(520.dp)
                        .padding(24.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Kinoma Update Available",
                            style = MaterialTheme.typography.titleLarge,
                            color = Color(0xFFc084fc)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Version ${updateInfo!!.latestVersionName} is ready to install.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = updateInfo!!.releaseNotes,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            if (!updateInfo!!.mandatory) {
                                Button(
                                    onClick = { showUpdateDialog = false }
                                ) {
                                    Text("Later")
                                }
                            }
                            var progress by remember { mutableStateOf(0) }
                            var isDownloading by remember { mutableStateOf(false) }

                            Button(
                                onClick = {
                                    isDownloading = true
                                    UpdateChecker.downloadAndInstall(context, updateInfo!!.apkUrl, updateInfo!!.sha256, { p ->
                                        progress = p
                                    }, {
                                        showUpdateDialog = false
                                        isDownloading = false
                                    }, { error ->
                                        isDownloading = false
                                        errorMessage = error
                                    })
                                },
                                enabled = !isDownloading
                            ) {
                                Text(if (isDownloading) "Downloading $progress%" else "Update Now")
                            }
                        }
                    }
                }
            }
        }
    }
}
