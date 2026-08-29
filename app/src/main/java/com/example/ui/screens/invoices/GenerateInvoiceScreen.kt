package com.example.ui.screens.invoices

import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.entity.ClientEntity
import com.example.data.entity.InvoiceEntity
import com.example.ui.theme.FacturaOutlineVariant
import com.example.ui.theme.FacturaPrimary
import com.example.ui.theme.FacturaSecondary
import com.example.ui.theme.FacturaSurfaceContainerLow
import com.example.ui.theme.WhatsAppGreen
import com.example.ui.viewmodel.FacturaViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GenerateInvoiceScreen(
    viewModel: FacturaViewModel,
    onBackClick: () -> Unit,
    onInvoiceCreated: (InvoiceEntity) -> Unit,
    onAddNewClientClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clients by viewModel.clients.collectAsStateWithLifecycle()
    val profile by viewModel.companyProfile.collectAsStateWithLifecycle()

    var selectedClient by remember(clients) {
        mutableStateOf(clients.firstOrNull())
    }
    var clientDropdownExpanded by remember { mutableStateOf(false) }

    val subscriptionPlans = listOf(
        "Software Subscription - Standard" to 100.0,
        "Software Subscription - Oct" to 100.0,
        "Plan Enterprise Cloud" to 250.0,
        "Plan Corporativo Plus" to 400.0,
        "Comisiones BPV / TPG Compra" to 1.11,
        "Suscripción Mensual FacturaPro" to 50.0
    )

    var selectedPlan by remember { mutableStateOf(subscriptionPlans[1].first) }
    var planDropdownExpanded by remember { mutableStateOf(false) }
    var customAmountUsd by remember { mutableStateOf("100.00") }

    val paymentMethods = listOf("Zelle", "Pago Móvil", "Transfer")
    var selectedPaymentMethod by remember { mutableStateOf("Zelle") }
    var referenceNumber by remember { mutableStateOf("REF-984723") }

    var customBcvRateText by remember(profile) {
        mutableStateOf((profile?.bcvRate ?: 474.0598).toString())
    }

    val bcvRate = customBcvRateText.toDoubleOrNull() ?: 474.0598
    val amountUsd = customAmountUsd.toDoubleOrNull() ?: 100.00
    val ivaUsd = amountUsd * 0.16
    val totalUsd = amountUsd + ivaUsd

    val amountBs = amountUsd * bcvRate
    val ivaBs = ivaUsd * bcvRate
    val totalBs = totalUsd * bcvRate

    val currentDateStr = remember {
        SimpleDateFormat("MMM dd, yyyy", Locale.US).format(Date())
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Generate Digital Invoice",
                        fontWeight = FontWeight.Bold,
                        fontSize = 19.sp,
                        color = FacturaPrimary
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier.testTag("generate_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color(0xFF006495)
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
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // 1. Client Selector Field
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Select Client",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = FacturaPrimary
                    )
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedClient?.fullName ?: "Seleccionar Cliente",
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { clientDropdownExpanded = true }) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Select Client"
                                    )
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("select_client_field")
                                .clickable { clientDropdownExpanded = true }
                        )

                        DropdownMenu(
                            expanded = clientDropdownExpanded,
                            onDismissRequest = { clientDropdownExpanded = false },
                            modifier = Modifier.fillMaxWidth(0.9f)
                        ) {
                            clients.forEach { client ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(
                                                text = client.fullName,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 14.sp
                                            )
                                            Text(
                                                text = "RIF: ${client.rif}",
                                                fontSize = 12.sp,
                                                color = Color.Gray
                                            )
                                        }
                                    },
                                    onClick = {
                                        selectedClient = client
                                        clientDropdownExpanded = false
                                    }
                                )
                            }
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.PersonAdd,
                                            contentDescription = "Add",
                                            tint = FacturaSecondary
                                        )
                                        Text(
                                            text = "+ Registrar Nuevo Cliente",
                                            fontWeight = FontWeight.Bold,
                                            color = FacturaSecondary
                                        )
                                    }
                                },
                                onClick = {
                                    clientDropdownExpanded = false
                                    onAddNewClientClick()
                                }
                            )
                        }
                    }
                }
            }

            // 2. Subscription Plan Field
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Select Subscription Plan / Concept",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = FacturaPrimary
                    )
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedPlan,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { planDropdownExpanded = true }) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Select Plan"
                                    )
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("select_plan_field")
                                .clickable { planDropdownExpanded = true }
                        )

                        DropdownMenu(
                            expanded = planDropdownExpanded,
                            onDismissRequest = { planDropdownExpanded = false },
                            modifier = Modifier.fillMaxWidth(0.9f)
                        ) {
                            subscriptionPlans.forEach { (plan, price) ->
                                DropdownMenuItem(
                                    text = {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(plan, fontSize = 14.sp)
                                            Text("$$price", fontWeight = FontWeight.Bold)
                                        }
                                    },
                                    onClick = {
                                        selectedPlan = plan
                                        customAmountUsd = price.toString()
                                        planDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Amount USD and BCV Rate row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = customAmountUsd,
                        onValueChange = { customAmountUsd = it },
                        label = { Text("Monto USD") },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("invoice_amount_usd_input")
                    )
                    OutlinedTextField(
                        value = customBcvRateText,
                        onValueChange = { customBcvRateText = it },
                        label = { Text("Tasa BCV (Bs/USD)") },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("invoice_bcv_rate_input")
                    )
                }
            }

            // 3. Payment Method Segmented Tabs
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Payment Method",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = FacturaPrimary
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFE2E8F0))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        paymentMethods.forEach { method ->
                            val isSelected = method == selectedPaymentMethod
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) Color.White else Color.Transparent)
                                    .clickable { selectedPaymentMethod = method }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = method,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) FacturaPrimary else Color.DarkGray
                                )
                            }
                        }
                    }
                }
            }

            // 4. Reference Number
            item {
                OutlinedTextField(
                    value = referenceNumber,
                    onValueChange = { referenceNumber = it },
                    label = { Text("Reference Number") },
                    placeholder = { Text("Ej. REF-0948372") },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("reference_number_input")
                )
            }

            // 5. INVOICE PREVIEW CARD (Matching Screen 3)
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                    border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.5f))),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "INVOICE PREVIEW",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = FacturaPrimary,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
                        )

                        PreviewLine(label = "Invoice #:", value = "00012345")
                        PreviewLine(label = "Date:", value = currentDateStr)
                        PreviewLine(label = "Client:", value = selectedClient?.fullName ?: "Servicios Tecnológicos CA")
                        PreviewLine(label = "RIF:", value = selectedClient?.rif ?: "J-30123456-7")
                        PreviewLine(label = "Concept:", value = selectedPlan)
                        PreviewLine(label = "BCV Rate:", value = "${FacturaViewModel.formatBcv(bcvRate)} Bs/USD")
                        PreviewLine(
                            label = "Amount:",
                            value = "${FacturaViewModel.formatUsd(amountUsd)} (${FacturaViewModel.formatBs(amountBs)})"
                        )
                        PreviewLine(
                            label = "IVA (16%):",
                            value = "${FacturaViewModel.formatUsd(ivaUsd)} (${FacturaViewModel.formatBs(ivaBs)})"
                        )
                        PreviewLine(
                            label = "Total:",
                            value = "${FacturaViewModel.formatUsd(totalUsd)} (${FacturaViewModel.formatBs(totalBs)})",
                            isBold = true
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Digital signature placeholder valid for SENIAT
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFF94A3B8), RoundedCornerShape(8.dp))
                                .background(Color.White)
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "DIGITAL SIGNATURE PLACEHOLDER - VALID FOR SENIAT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E293B),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            // 6. Action: Generate & Save Invoice
            item {
                Button(
                    onClick = {
                        val client = selectedClient ?: ClientEntity(
                            fullName = "Servicios Tecnológicos CA",
                            rif = "J-30123456-7",
                            email = "info@servicios.com",
                            phone = "04149665870"
                        )
                        viewModel.generateInvoice(
                            client = client,
                            concept = selectedPlan,
                            amountUsd = amountUsd,
                            paymentMethod = selectedPaymentMethod,
                            referenceNumber = referenceNumber,
                            applyIgtf = false,
                            customBcvRate = bcvRate,
                            onSuccess = { createdInvoice ->
                                onInvoiceCreated(createdInvoice)
                            }
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = FacturaPrimary),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("generate_and_save_button")
                ) {
                    Text(
                        text = "Emitir Factura Digital",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // 7. Secondary Action: WhatsApp & Email buttons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            val clientName = selectedClient?.fullName ?: "Cliente"
                            val text = "Hola $clientName, adjuntamos su Factura Digital por $selectedPlan por un total de ${FacturaViewModel.formatUsd(totalUsd)} (${FacturaViewModel.formatBs(totalBs)}). Tasa BCV: ${FacturaViewModel.formatBcv(bcvRate)} Bs/USD."
                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                data = Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(text)}")
                            }
                            try {
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Compartiendo vía WhatsApp", Toast.LENGTH_SHORT).show()
                            }
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = WhatsAppGreen),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("send_whatsapp_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "WhatsApp",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "WhatsApp",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Button(
                        onClick = {
                            val clientName = selectedClient?.fullName ?: "Cliente"
                            val clientEmail = selectedClient?.email ?: "cliente@correo.com"
                            val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                                data = Uri.parse("mailto:$clientEmail")
                                putExtra(Intent.EXTRA_SUBJECT, "Factura Digital - $selectedPlan")
                                putExtra(Intent.EXTRA_TEXT, "Estimado $clientName,\n\nLe enviamos su Factura Digital emitida de conformidad con la Providencia SENIAT.\nTotal: ${FacturaViewModel.formatUsd(totalUsd)} / ${FacturaViewModel.formatBs(totalBs)}\n\nGracias por su confianza.")
                            }
                            try {
                                context.startActivity(emailIntent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Enviando correo a $clientEmail", Toast.LENGTH_SHORT).show()
                            }
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF007AFF)),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("send_email_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = "Email",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Send Email",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PreviewLine(
    label: String,
    value: String,
    isBold: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium,
            color = if (isBold) FacturaPrimary else Color(0xFF334155)
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
            color = if (isBold) FacturaPrimary else Color(0xFF0F172A),
            textAlign = TextAlign.End
        )
    }
}
