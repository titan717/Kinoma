package com.kinoma.tv.data

import com.google.gson.annotations.SerializedName

data class AnimeItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: Any?,
    @SerializedName("image") val image: String?,
    @SerializedName("cover") val cover: String?,
    @SerializedName("rating") val rating: Int?,
    @SerializedName("type") val type: String?,
    @SerializedName("description") val description: String?,
    @SerializedName("genres") val genres: List<String>?,
    @SerializedName("totalEpisodes") val totalEpisodes: Int?
) {
    val displayTitle: String
        get() {
            if (title is String) return title
            if (title is Map<*, *>) {
                return (title["english"] as? String) ?: (title["romaji"] as? String) ?: "Unknown Anime"
            }
            return "Unknown Anime"
        }
}

data class AnimeListResponse(
    @SerializedName("results") val results: List<AnimeItem>?
)

data class UpdateInfo(
    @SerializedName("latestVersionCode") val latestVersionCode: Int,
    @SerializedName("latestVersionName") val latestVersionName: String,
    @SerializedName("apkUrl") val apkUrl: String,
    @SerializedName("releaseNotes") val releaseNotes: String,
    @SerializedName("mandatory") val mandatory: Boolean
)
