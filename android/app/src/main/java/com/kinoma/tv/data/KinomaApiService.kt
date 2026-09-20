package com.kinoma.tv.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface KinomaApiService {
    @GET("api/anime/trending")
    suspend fun getTrending(): AnimeListResponse

    @GET("api/anime/popular")
    suspend fun getPopular(): AnimeListResponse

    @GET("api/anime/search/{query}")
    suspend fun searchAnime(@Path("query") query: String): AnimeListResponse

    companion object {
        private const val BASE_URL = "https://ais-dev-idpmqym35ummgdndid4c3h-880382000432.asia-east1.run.app/"

        val instance: KinomaApiService by lazy {
            Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(KinomaApiService::class.java)
        }
    }
}
