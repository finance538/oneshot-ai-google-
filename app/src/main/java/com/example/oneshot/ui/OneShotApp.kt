package com.example.oneshot.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.SettingsInputComponent
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.oneshot.ui.components.NotificationBanner
import com.example.oneshot.ui.components.OneShotHeader
import com.example.oneshot.ui.screens.CeoSuiteScreen
import com.example.oneshot.ui.screens.CheckoutScreen
import com.example.oneshot.ui.screens.GatewayIntegrationsScreen
import com.example.oneshot.ui.screens.MerchantDashboardScreen
import com.example.oneshot.ui.screens.OperationsCenterScreen
import com.example.oneshot.ui.screens.PaymentLinksScreen
import com.example.oneshot.ui.screens.StorefrontScreen
import com.example.oneshot.ui.screens.WalletScreen
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.viewmodel.OneShotViewModel
import com.example.oneshot.ui.viewmodel.ScreenTab
import kotlinx.coroutines.delay

data class NavItem(
    val tab: ScreenTab,
    val icon: ImageVector,
    val label: String
)

@Composable
fun OneShotApp(
    viewModel: OneShotViewModel = viewModel()
) {
    val currentTab by viewModel.currentTab.collectAsState()
    val walletState by viewModel.walletState.collectAsState()
    val notification by viewModel.notification.collectAsState()

    var showSplash by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        delay(800)
        showSplash = false
    }

    val navItems = listOf(
        NavItem(ScreenTab.STOREFRONT, Icons.Default.Storefront, "الخدمات"),
        NavItem(ScreenTab.WALLET, Icons.Default.AccountBalanceWallet, "المحفظة"),
        NavItem(ScreenTab.CEO_SUITE, Icons.Default.BusinessCenter, "مكتب CEO"),
        NavItem(ScreenTab.DASHBOARD, Icons.Default.Dashboard, "التاجر"),
        NavItem(ScreenTab.PAYMENT_LINKS, Icons.Default.Link, "الروابط"),
        NavItem(ScreenTab.INTEGRATIONS, Icons.Default.SettingsInputComponent, "الربط"),
        NavItem(ScreenTab.OPERATIONS, Icons.Default.AdminPanelSettings, "إدارة AI")
    )

    if (currentTab != ScreenTab.STOREFRONT) {
        androidx.activity.compose.BackHandler {
            if (currentTab == ScreenTab.CHECKOUT) {
                viewModel.setTab(ScreenTab.DASHBOARD)
            } else {
                viewModel.setTab(ScreenTab.STOREFRONT)
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                OneShotHeader(
                    balance = walletState.balance,
                    onWalletClick = { viewModel.setTab(ScreenTab.WALLET) }
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = ObsidianBlack,
                    contentColor = NeutralWhite,
                    tonalElevation = 8.dp
                ) {
                    navItems.forEach { item ->
                        val isSelected = currentTab == item.tab
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { viewModel.setTab(item.tab) },
                            icon = {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.label,
                                    modifier = Modifier.size(19.dp)
                                )
                            },
                            label = {
                                Text(
                                    text = item.label,
                                    fontSize = 9.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = NeutralWhite,
                                selectedTextColor = FlameOrange,
                                unselectedIconColor = NeutralMuted,
                                unselectedTextColor = NeutralMuted,
                                indicatorColor = FlameOrange
                            ),
                            modifier = Modifier.testTag("nav_tab_${item.tab.name.lowercase()}")
                        )
                    }
                }
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                if (notification != null) {
                    NotificationBanner(
                        message = notification!!.message,
                        isError = notification!!.isError,
                        onDismiss = { viewModel.dismissNotification() }
                    )
                }

                when (currentTab) {
                    ScreenTab.STOREFRONT -> StorefrontScreen(viewModel = viewModel)
                    ScreenTab.WALLET -> WalletScreen(viewModel = viewModel)
                    ScreenTab.CEO_SUITE -> CeoSuiteScreen(viewModel = viewModel)
                    ScreenTab.DASHBOARD -> MerchantDashboardScreen(viewModel = viewModel)
                    ScreenTab.PAYMENT_LINKS -> PaymentLinksScreen(viewModel = viewModel)
                    ScreenTab.INTEGRATIONS -> GatewayIntegrationsScreen(viewModel = viewModel)
                    ScreenTab.OPERATIONS -> OperationsCenterScreen(viewModel = viewModel)
                    ScreenTab.CHECKOUT -> CheckoutScreen(viewModel = viewModel)
                }
            }
        }

        // Camera Shutter Splash Overlay
        AnimatedVisibility(
            visible = showSplash,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = ObsidianBlack
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(70.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(FlameOrange),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "o|",
                                color = NeutralWhite,
                                fontWeight = FontWeight.Black,
                                fontSize = 38.sp
                            )
                        }
                        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
                        Text(
                            text = "oneShot",
                            color = NeutralWhite,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "PAYMENT STUDIO & PRODUCTION",
                            color = FlameOrange,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                    }
                }
            }
        }
    }
}
