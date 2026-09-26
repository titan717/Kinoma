package com.kinoma.tv.data

import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

interface KinomaApiService {
    @GET("trending")
    suspend fun getTrending(@Query("window") window: String = "day"): MovieApiResponse<AnimeListResponse>

    @GET("popular/tv")
    suspend fun getPopular(@Query("page") page: Int = 1): MovieApiResponse<AnimeListResponse>

    @GET("search")
    suspend fun searchAnime(@Query("q") query: String, @Query("limit") limit: Int = 20, @Query("page") page: Int = 1): MovieApiResponse<AnimeListResponse>

    companion object {
        private const val BASE_URL = "https://apikinoma.vercel.app/api/v1/"

        val instance: KinomaApiService by lazy {
            val loggingInterceptor = HttpLoggingInterceptor { message ->
                Log.d("KinomaApiDiagnostics", message)
            }.apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
                .addInterceptor { chain ->
                    val request = chain.request()
                    val response = chain.proceed(request)
                    val url = request.url
                    val status = response.code
                    val contentType = response.body?.contentType()?.toString() ?: "unknown"
                    val bodyString = response.peekBody(512).string()
                    Log.i("KinomaApiDiagnostics", "REQUEST URL: $url | HTTP STATUS: $status | CONTENT TYPE: $contentType | RESPONSE PREVIEW: $bodyString")
                    response
                }
                .build()

            Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(KinomaApiService::class.java)
        }
    }
}
