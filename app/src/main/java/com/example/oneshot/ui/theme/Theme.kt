package com.example.oneshot.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = FlameOrange,
    onPrimary = NeutralWhite,
    primaryContainer = FlameHover,
    onPrimaryContainer = NeutralWhite,
    secondary = FlameOrange,
    onSecondary = NeutralWhite,
    background = ObsidianBlack,
    onBackground = NeutralWhite,
    surface = ObsidianSurface,
    onSurface = NeutralWhite,
    surfaceVariant = ObsidianCard,
    onSurfaceVariant = NeutralMuted,
    outline = ObsidianBorder
)

private val LightColorScheme = lightColorScheme(
    primary = FlameOrange,
    onPrimary = NeutralWhite,
    primaryContainer = FlameSoft,
    onPrimaryContainer = FlameOrange,
    secondary = ObsidianBlack,
    onSecondary = NeutralWhite,
    background = NeutralBackground,
    onBackground = NeutralText,
    surface = NeutralSurface,
    onSurface = NeutralText,
    surfaceVariant = NeutralBackground,
    onSurfaceVariant = NeutralMuted,
    outline = NeutralBorder
)

@Composable
fun OneShotTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
