package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = FacturaDarkPrimary,
    onPrimary = FacturaDarkOnPrimary,
    primaryContainer = FacturaDarkPrimaryContainer,
    onPrimaryContainer = FacturaDarkOnPrimaryContainer,
    secondary = FacturaSecondaryContainer,
    onSecondary = FacturaOnSecondaryContainer,
    background = FacturaDarkBackground,
    surface = FacturaDarkSurface,
    onBackground = FacturaDarkOnSurface,
    onSurface = FacturaDarkOnSurface,
    surfaceVariant = FacturaDarkSurfaceContainerLow,
    onSurfaceVariant = FacturaDarkOnSurfaceVariant,
    outline = FacturaOutline,
    outlineVariant = FacturaOutlineVariant
)

private val LightColorScheme = lightColorScheme(
    primary = FacturaPrimary,
    onPrimary = FacturaOnPrimary,
    primaryContainer = FacturaPrimaryContainer,
    onPrimaryContainer = FacturaOnPrimaryContainer,
    secondary = FacturaSecondary,
    onSecondary = FacturaOnSecondary,
    secondaryContainer = FacturaSecondaryContainer,
    onSecondaryContainer = FacturaOnSecondaryContainer,
    tertiary = FacturaTertiary,
    onTertiary = FacturaOnTertiary,
    background = FacturaBackground,
    surface = FacturaSurface,
    onBackground = FacturaOnBackground,
    onSurface = FacturaOnSurface,
    surfaceVariant = FacturaSurfaceVariant,
    onSurfaceVariant = FacturaOnSurfaceVariant,
    outline = FacturaOutline,
    outlineVariant = FacturaOutlineVariant
)

@Composable
fun FacturaProTheme(
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
