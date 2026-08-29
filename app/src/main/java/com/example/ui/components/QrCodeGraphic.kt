package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
fun FiscalQrCode(
    modifier: Modifier = Modifier,
    contentData: String = "SENIAT-FACTURA-DIGITAL-108991"
) {
    Box(
        modifier = modifier
            .background(Color.White, RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
            .padding(6.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .aspectRatio(1f)
        ) {
            val canvasSize = size.minDimension
            val matrixSize = 21
            val cellSize = canvasSize / matrixSize

            // Pseudo-random deterministic grid based on contentData hash
            val hash = contentData.hashCode()

            // Draw Finder Patterns (Top-Left, Top-Right, Bottom-Left)
            drawFinderPattern(0f, 0f, cellSize)
            drawFinderPattern((matrixSize - 7) * cellSize, 0f, cellSize)
            drawFinderPattern(0f, (matrixSize - 7) * cellSize, cellSize)

            // Draw data modules
            for (row in 0 until matrixSize) {
                for (col in 0 until matrixSize) {
                    // Skip finder pattern zones
                    val inTopLeft = row < 8 && col < 8
                    val inTopRight = row < 8 && col >= matrixSize - 8
                    val inBottomLeft = row >= matrixSize - 8 && col < 8

                    if (!inTopLeft && !inTopRight && !inBottomLeft) {
                        val bit = ((hash * (row + 1) * 31 + col * 17 + row xor col) % 3) == 0
                        val isTiming = (row == 6 && col % 2 == 0) || (col == 6 && row % 2 == 0)
                        if (bit || isTiming) {
                            drawRect(
                                color = Color(0xFF0F172A),
                                topLeft = Offset(col * cellSize, row * cellSize),
                                size = Size(cellSize * 0.95f, cellSize * 0.95f)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun DrawScope.drawFinderPattern(x: Float, y: Float, cellSize: Float) {
    val outerSize = 7 * cellSize
    // Outer black square
    drawRoundRect(
        color = Color(0xFF0F172A),
        topLeft = Offset(x, y),
        size = Size(outerSize, outerSize),
        cornerRadius = CornerRadius(cellSize * 0.8f, cellSize * 0.8f),
        style = Stroke(width = cellSize)
    )
    // Inner filled square
    val innerOffset = 2 * cellSize
    val innerSize = 3 * cellSize
    drawRoundRect(
        color = Color(0xFF0F172A),
        topLeft = Offset(x + innerOffset, y + innerOffset),
        size = Size(innerSize, innerSize),
        cornerRadius = CornerRadius(cellSize * 0.4f, cellSize * 0.4f),
        style = Fill
    )
}
