package com.example.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.PendingActions
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.entity.InvoiceEntity
import com.example.ui.theme.AmberPending
import com.example.ui.theme.FacturaOutlineVariant
import com.example.ui.theme.FacturaPrimary
import com.example.ui.theme.FacturaSecondaryContainer
import com.example.ui.theme.FacturaSurfaceBright
import com.example.ui.theme.FacturaSurfaceContainerLow
import com.example.ui.theme.GoldAccent
import com.example.ui.theme.GreenSuccess
import com.example.ui.viewmodel.FacturaViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: FacturaViewModel,
    onCreateInvoiceClick: () -> Unit,
    onInvoiceClick: (InvoiceEntity) -> Unit,
    onProfileClick: () -> Unit,
    onViewAllInvoicesClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.dashboardState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Provider Dashboard",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = FacturaPrimary
                    )
                },
                actions = {
                    IconButton(
                        onClick = onProfileClick,
                        modifier = Modifier.testTag("home_profile_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = "Profile & Settings",
                            tint = FacturaPrimary,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // 1. Primary Action Button
            item {
                Button(
                    onClick = onCreateInvoiceClick,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = FacturaPrimary,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("create_new_invoice_button")
                ) {
                    Text(
                        text = "Create New Invoice",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // 2. Monthly Revenue Section
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Monthly Revenue",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = FacturaPrimary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // USD Card
                        RevenueCard(
                            badgeText = "$",
                            currencyCode = "USD",
                            mainAmount = FacturaViewModel.formatUsd(state.totalRevenueUsd),
                            secondaryLabel = "USD",
                            footerLabel = "Total Earned (Nov)",
                            modifier = Modifier.weight(1f)
                        )

                        // VEF Card
                        RevenueCard(
                            badgeText = "Bs",
                            currencyCode = "VEF",
                            mainAmount = FacturaViewModel.formatBs(state.totalRevenueBs),
                            secondaryLabel = "VEF",
                            footerLabel = "BCV Rate: ${FacturaViewModel.formatBcv(state.bcvRate)}",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // 3. Subscription Summary Section
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Subscription Summary",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = FacturaPrimary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Active Subscriptions
                        SummaryStatCard(
                            icon = Icons.Default.FactCheck,
                            title = "Active Subscriptions",
                            value = "${state.activeSubscriptionsCount}",
                            modifier = Modifier.weight(1f)
                        )

                        // Pending Payments
                        SummaryStatCard(
                            icon = Icons.Default.PendingActions,
                            title = "Pending Payments",
                            value = "${state.pendingPaymentsCount}",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // 4. Recent Invoices Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Invoices",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = FacturaPrimary
                    )
                    Text(
                        text = "Ver Todas",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier
                            .clickable { onViewAllInvoicesClick() }
                            .padding(4.dp)
                    )
                }
            }

            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.5f))),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        if (state.recentInvoices.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No hay facturas recientes.",
                                    color = Color.Gray,
                                    fontSize = 14.sp
                                )
                            }
                        } else {
                            state.recentInvoices.forEachIndexed { index, invoice ->
                                RecentInvoiceRow(
                                    invoice = invoice,
                                    onClick = { onInvoiceClick(invoice) }
                                )
                                if (index < state.recentInvoices.size - 1) {
                                    HorizontalDivider(
                                        color = FacturaOutlineVariant.copy(alpha = 0.25f),
                                        thickness = 0.8.dp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RevenueCard(
    badgeText: String,
    currencyCode: String,
    mainAmount: String,
    secondaryLabel: String,
    footerLabel: String,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = FacturaSurfaceContainerLow),
        border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.4f))),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(FacturaPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = badgeText,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = currencyCode,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = FacturaPrimary
                )
            }

            Column {
                Text(
                    text = mainAmount,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF006495), // Or Gold / Blue as in mockups
                    lineHeight = 22.sp
                )
                Text(
                    text = secondaryLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF006495).copy(alpha = 0.6f)
                )
            }

            Text(
                text = footerLabel,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@Composable
private fun SummaryStatCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = FacturaSurfaceContainerLow),
        border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.4f))),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(FacturaPrimary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }

            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = value,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF006495)
            )
        }
    }
}

@Composable
private fun RecentInvoiceRow(
    invoice: InvoiceEntity,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = invoice.clientName,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = FacturaPrimary
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "#INV-${invoice.issueDate.replace("/", "-")}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "|",
                    fontSize = 12.sp,
                    color = FacturaOutlineVariant
                )
                Text(
                    text = if (invoice.status == "PAID") "Paid" else "Pending",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (invoice.status == "PAID") Color(0xFF006495) else AmberPending
                )
                Text(
                    text = "|",
                    fontSize = 12.sp,
                    color = FacturaOutlineVariant
                )
                Text(
                    text = FacturaViewModel.formatUsd(invoice.totalUsd),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        if (invoice.status == "PAID") {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Paid",
                tint = Color(0xFF006495),
                modifier = Modifier.size(24.dp)
            )
        } else {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Pending",
                tint = AmberPending,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
