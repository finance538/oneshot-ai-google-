package com.example.oneshot.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.ui.theme.ErrorBg
import com.example.oneshot.ui.theme.ErrorRed
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.ObsidianCard
import com.example.oneshot.ui.theme.SuccessBg
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.theme.WarningBg
import com.example.oneshot.ui.theme.WarningAmber

@Composable
fun OneShotHeader(
    modifier: Modifier = Modifier,
    balance: Double,
    onWalletClick: () -> Unit
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = ObsidianBlack,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Brand Logo & Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(FlameOrange),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "o|",
                        color = NeutralWhite,
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp
                    )
                }
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "oneShot",
                            color = NeutralWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF222727))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "STUDIO",
                                color = FlameOrange,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Text(
                        text = "منصة المدفوعات والإنتاج الإبداعي",
                        color = Color(0xFFA8AFAE),
                        fontSize = 10.sp
                    )
                }
            }

            // Wallet Balance Chip
            Surface(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .clickable { onWalletClick() }
                    .border(1.dp, Color(0xFF333A3A), RoundedCornerShape(20.dp))
                    .testTag("header_wallet_chip"),
                color = Color(0xFF1E2222)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen)
                    )
                    Text(
                        text = "${String.format(java.util.Locale.US, "%,.0f", balance)} ر.س",
                        color = NeutralWhite,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, textColor, label) = when (status.lowercase()) {
        "paid", "completed", "success" -> Triple(SuccessBg, SuccessGreen, "مكتمل")
        "pending" -> Triple(WarningBg, WarningAmber, "معلق")
        "review" -> Triple(WarningBg, Color(0xFFC77700), "قيد المراجعة")
        "cancelled", "failed" -> Triple(ErrorBg, ErrorRed, "ملغي")
        else -> Triple(Color(0xFFF1F3F4), NeutralMuted, status)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .border(0.5.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(textColor)
            )
            Text(
                text = label,
                color = textColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun MetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    suffix: String? = null,
    icon: ImageVector,
    featured: Boolean = false
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .border(
                1.dp,
                if (featured) FlameOrange.copy(alpha = 0.3f) else NeutralBorder,
                RoundedCornerShape(12.dp)
            ),
        color = if (featured) FlameSoft else NeutralWhite,
        shadowElevation = 0.dp
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    color = if (featured) FlameOrange else NeutralMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (featured) FlameOrange.copy(alpha = 0.15f) else Color(0xFFF2F4F5)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (featured) FlameOrange else NeutralMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Baseline) {
                Text(
                    text = value,
                    color = if (featured) FlameOrange else ObsidianBlack,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
                if (suffix != null) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = suffix,
                        color = NeutralMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
            }
        }
    }
}

@Composable
fun NotificationBanner(
    message: String,
    isError: Boolean,
    onDismiss: () -> Unit
) {
    val bgColor = if (isError) ErrorBg else SuccessBg
    val textColor = if (isError) ErrorRed else SuccessGreen

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = message,
                color = textColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "إغلاق",
                    tint = textColor,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
