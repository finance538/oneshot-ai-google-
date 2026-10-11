package com.example.oneshot.data.repository

import com.example.oneshot.data.model.GatewayConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object GatewayRepository {

    private val _config = MutableStateFlow(GatewayConfig())
    val config: StateFlow<GatewayConfig> = _config.asStateFlow()

    fun updatePaytabs(
        profileId: String,
        serverKey: String,
        clientKey: String,
        apiBase: String
    ) {
        _config.value = _config.value.copy(
            paytabsProfileId = profileId,
            paytabsServerKey = serverKey,
            paytabsClientKey = clientKey,
            paytabsApiBase = apiBase,
            paytabsStatus = "connected"
        )
    }

    fun updateTelr(
        storeId: String,
        apiKey: String,
        testMode: Boolean
    ) {
        _config.value = _config.value.copy(
            telrStoreId = storeId,
            telrApiKey = apiKey,
            telrTestMode = testMode,
            telrStatus = "connected"
        )
    }
}
