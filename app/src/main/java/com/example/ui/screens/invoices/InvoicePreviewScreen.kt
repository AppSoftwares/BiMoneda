package com.example.ui.screens.invoices

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Pending
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Token
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.entity.InvoiceEntity
import com.example.ui.components.FiscalQrCode
import com.example.ui.theme.FacturaOutlineVariant
import com.example.ui.theme.FacturaPrimary
import com.example.ui.theme.FacturaSecondary
import com.example.ui.theme.FacturaSurfaceContainerHigh
import com.example.ui.theme.FacturaSurfaceContainerLow
import com.example.ui.theme.RedControl
import com.example.ui.viewmodel.FacturaViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoicePreviewScreen(
    invoice: InvoiceEntity,
    viewModel: FacturaViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profile by viewModel.companyProfile.collectAsStateWithLifecycle()
    val scrollState = rememberScrollState()

    val companyName = profile?.companyName ?: "MERCOSUR CASA DE BOLSA S.A"
    val slogan = profile?.slogan ?: "TU CASA DE BOLSA"
    val companyRif = profile?.rif ?: "J-304554141"
    val companyAddress = profile?.address ?: "AV VENEZUELA CON CALLE MOHEDANO EDIF TORRE JWM PISO SEIS (06) OF 1 URB EL ROSAL CARACAS (CHACAO) MIRANDA ZONA POSTAL 1060"
    val companyPhone = profile?.phone ?: "0212 952 41 65"
    val companyEmail = profile?.email ?: "negocios@mercosur.com.ve"
    val companyCode = profile?.economicActivityCode ?: "9499"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Digital Invoice Preview",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = FacturaPrimary
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier.testTag("preview_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = FacturaPrimary
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_SUBJECT, "Factura #${invoice.invoiceNumber}")
                                putExtra(
                                    Intent.EXTRA_TEXT,
                                    "Factura Digital Legal # ${invoice.invoiceNumber}\nControl: ${invoice.controlNumber}\nCliente: ${invoice.clientName}\nRIF: ${invoice.clientRif}\nTotal: ${FacturaViewModel.formatUsd(invoice.totalUsd)} / ${FacturaViewModel.formatBs(invoice.totalBs)}\nTasa BCV: ${FacturaViewModel.formatBcv(invoice.bcvRate)}"
                                )
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Compartir Factura"))
                        },
                        modifier = Modifier.testTag("share_invoice_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share",
                            tint = FacturaPrimary
                        )
                    }
                    IconButton(
                        onClick = {
                            Toast.makeText(context, "Factura #${invoice.invoiceNumber} lista para imprimir/descargar", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.testTag("download_invoice_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = "Download",
                            tint = FacturaPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { viewModel.toggleInvoiceStatus(invoice) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (invoice.status == "PAID") Color(0xFF0F766E) else Color(0xFFD97706)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Icon(
                        imageVector = if (invoice.status == "PAID") Icons.Default.CheckCircle else Icons.Default.Pending,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (invoice.status == "PAID") "Estado: Pagada" else "Estado: Pendiente",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Button(
                    onClick = {
                        val text = "Estimado cliente ${invoice.clientName},\nLe enviamos su Factura Digital Legal Nº ${invoice.invoiceNumber} (Control: ${invoice.controlNumber}).\nTotal a Pagar: ${FacturaViewModel.formatUsd(invoice.totalUsd)} (${FacturaViewModel.formatBs(invoice.totalBs)}).\nTasa BCV: ${FacturaViewModel.formatBcv(invoice.bcvRate)} Bs/USD."
                        val intent = Intent(Intent.ACTION_VIEW).apply {
                            data = Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(text)}")
                        }
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Compartiendo vía WhatsApp", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = FacturaPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text(
                        text = "Enviar al Cliente",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Main Fiscal Invoice Document Card (Pixel-perfect matching Screen 6 & 11)
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFCBD5E1))),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // 1. Company Header and Factura Meta Box
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        // Left: Company Info
                        Column(
                            modifier = Modifier.weight(1f).padding(end = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(FacturaPrimary),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Token,
                                        contentDescription = "Logo",
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = companyName,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = FacturaPrimary
                                    )
                                    Text(
                                        text = slogan,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color.Gray
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "RIF: $companyRif", fontSize = 9.sp, color = Color(0xFF475569))
                            Text(text = companyAddress, fontSize = 8.5.sp, lineHeight = 11.sp, color = Color(0xFF475569))
                            Text(text = "Telefono: $companyPhone", fontSize = 9.sp, color = Color(0xFF475569))
                            Text(text = "Correo: $companyEmail", fontSize = 9.sp, color = Color(0xFF475569))
                            Text(text = "Código de Actividades Económicas: $companyCode", fontSize = 8.5.sp, color = Color(0xFF475569))
                        }

                        // Right: Factura Meta Block
                        Card(
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = FacturaSurfaceContainerLow),
                            border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFCBD5E1))),
                            modifier = Modifier.width(155.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(8.dp),
                                verticalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Text(
                                    text = "FACTURA",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = FacturaSecondary,
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Center
                                )
                                HorizontalDivider(color = Color(0xFFCBD5E1), thickness = 0.8.dp)

                                MetaRow("Nº Documento:", invoice.invoiceNumber, isBold = true)
                                MetaRow("Fecha de emisión:", invoice.issueDate)
                                MetaRow("Hora de emision:", invoice.issueTime)
                                MetaRow("Nº de Control:", invoice.controlNumber, valueColor = RedControl, isBold = true)
                                MetaRow("Fecha asignación:", invoice.issueDate)
                            }
                        }
                    }

                    // 2. Client Info Box + QR Code
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        // Client Info Details
                        Card(
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                            border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFE2E8F0))),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(
                                modifier = Modifier.padding(8.dp),
                                verticalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                ClientField("Nombre ó Razón Social:", invoice.clientName, isBold = true)
                                ClientField("Condición de Pago:", invoice.paymentCondition, isBold = true)
                                ClientField("Domicilio Fiscal:", invoice.clientAddress)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    ClientField("RIF/CI:", invoice.clientRif, modifier = Modifier.weight(1f))
                                    ClientField("Tipo Venta:", invoice.saleType, modifier = Modifier.weight(1f))
                                }
                                ClientField("Teléfono:", invoice.clientPhone)
                                ClientField("Observaciones:", invoice.observations)
                            }
                        }

                        // Fiscal QR Code
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.width(90.dp)
                        ) {
                            FiscalQrCode(
                                contentData = "RIF:${invoice.clientRif}|FAC:${invoice.invoiceNumber}|CTRL:${invoice.controlNumber}|TOTAL:${invoice.totalBs}",
                                modifier = Modifier.size(85.dp)
                            )
                            Text(
                                text = "Validar SENIAT",
                                fontSize = 8.sp,
                                color = Color.Gray,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }

                    // 3. Itemized Services Table (SENIAT format)
                    Card(
                        shape = RoundedCornerShape(6.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFCBD5E1))),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            // Table Header Row
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(FacturaSurfaceContainerLow)
                                    .padding(horizontal = 6.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Cant.", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(26.dp))
                                Text("Código", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(42.dp))
                                Text("Concepto / Descripción", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                                Text("Unid.", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(34.dp))
                                Text("Precio Unit.", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, modifier = Modifier.width(62.dp))
                                Text("Alic.", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.width(26.dp))
                            }
                            HorizontalDivider(color = Color(0xFFCBD5E1), thickness = 0.8.dp)

                            // Table Row 1
                            TableRow(
                                cant = "1",
                                code = invoice.serviceCode,
                                desc = "${invoice.concept} (${FacturaViewModel.formatUsd(invoice.subtotalUsd)})",
                                unid = invoice.serviceUnit,
                                unitPrice = FacturaViewModel.formatBs(invoice.subtotalBs),
                                alic = "(G)"
                            )

                            HorizontalDivider(color = Color(0xFFF1F5F9), thickness = 0.8.dp)

                            // Table Row 2 (if exists or secondary commission item)
                            TableRow(
                                cant = "1",
                                code = "IS0505",
                                desc = "Providencia Digital SNAT / Timbre Fiscal",
                                unid = "UNIDAD",
                                unitPrice = "0,00 Bs.",
                                alic = "(E)"
                            )
                        }
                    }

                    // 4. BCV Exchange Rate & Totals Table
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        // BCV rate badge
                        Card(
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = FacturaSurfaceContainerLow),
                            border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFCBD5E1))),
                            modifier = Modifier.weight(0.9f)
                        ) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Text(
                                    text = "Tipo de cambio BCV:",
                                    fontSize = 9.sp,
                                    color = Color(0xFF475569)
                                )
                                Text(
                                    text = "${FacturaViewModel.formatBcv(invoice.bcvRate)} Bs/USD",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = FacturaPrimary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // Totals Table
                        Card(
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFCBD5E1))),
                            modifier = Modifier.weight(1.3f)
                        ) {
                            Column {
                                TotalLine("SubTotal:", FacturaViewModel.formatUsd(invoice.subtotalUsd), FacturaViewModel.formatBs(invoice.subtotalBs))
                                TotalLine("Exento:", FacturaViewModel.formatUsd(invoice.exemptUsd), FacturaViewModel.formatBs(invoice.exemptBs))
                                TotalLine("Base Imponible 16%:", FacturaViewModel.formatUsd(invoice.taxableBaseUsd), FacturaViewModel.formatBs(invoice.taxableBaseBs))
                                TotalLine("IVA 16,00%:", FacturaViewModel.formatUsd(invoice.ivaUsd), FacturaViewModel.formatBs(invoice.ivaBs))
                                if (invoice.igtfUsd > 0) {
                                    TotalLine("IGTF (3%):", FacturaViewModel.formatUsd(invoice.igtfUsd), FacturaViewModel.formatBs(invoice.igtfBs))
                                }

                                // Total Row Banner
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(FacturaPrimary)
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Total:", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(FacturaViewModel.formatUsd(invoice.totalUsd), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                        Text(FacturaViewModel.formatBs(invoice.totalBs), color = Color(0xFF65BEFF), fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }

                    // 5. Customer Greeting Box
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(6.dp))
                            .background(FacturaSurfaceContainerHigh)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Gracias por confiar en nosotros, su suscripción está activa",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = FacturaPrimary,
                            textAlign = TextAlign.Center
                        )
                    }

                    // 6. Official SENIAT Legal Notice and Digital Imprenta
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        HorizontalDivider(color = Color(0xFFE2E8F0), thickness = 0.8.dp)
                        Text(
                            text = "Este pago estará sujeto al cobro adicional del 3% del Impuesto a las Grandes Transacciones Financieras (IGTF), de conformidad con la Providencia Administrativa SNAT/2022/000013 publicada en la G.O. N 42.339 del 17-03-2022, en caso de ser cancelado en divisas. No aplica en pago en Bs.\n\nEste documento se expresa en divisas con su equivalente en Bolívares al tipo de cambio corriente del mercado a la fecha de su emisión, según lo establecido en el artículo 13 numeral 14 de la Providencia Administrativa SNAT/2011/0071 en concordancia con el artículo 128 de la Ley del Banco Central de Venezuela (BCV); artículo 25 de la Ley que establece el Impuesto al Valor Agregado (IVA) y 38 del Reglamento General de la Ley que establece el Impuesto al Valor Agregado (RLIVA).",
                            fontSize = 7.5.sp,
                            lineHeight = 10.sp,
                            color = Color(0xFF64748B),
                            textAlign = TextAlign.Justify
                        )

                        HorizontalDivider(color = Color(0xFFE2E8F0), thickness = 0.8.dp)
                        Text(
                            text = "DOCUMENTO EMITIDO DE ACUERDO A LO DISPUESTO EN LA PROVIDENCIA ADMINISTRATIVA SNAT/2024/000102 DE FECHA 17/10/2024\nPROVEEDOR DE CERTIFICADOS PROCERT ITFB, C.A. J-31635373-7, AV LIBERTADOR EDIF MULTICENTRO EMPRESARIAL DEL ESTE, TORRE LIBERTADOR, NUCLEO B PISO 13 OF 132-B URB CHACAO CARACAS (CHACAO) MIRANDA ZONA POSTAL 1060, +58(212) 267 4880. Imprenta Digital Autorizada mediante la Providencia Administrativa Nro. SENIAT/INTI/2021/0000064 de fecha 03-08-2021, Nro de Control desde 00-105013 hasta el Nro. 00-113013 generados digitalmente.",
                            fontSize = 7.sp,
                            lineHeight = 9.5.sp,
                            color = Color(0xFF475569),
                            textAlign = TextAlign.Center,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MetaRow(
    label: String,
    value: String,
    valueColor: Color = Color.Unspecified,
    isBold: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 8.5.sp, color = Color(0xFF64748B))
        Text(
            text = value,
            fontSize = 8.5.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
            color = valueColor,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun ClientField(
    label: String,
    value: String,
    isBold: Boolean = false,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(text = label, fontSize = 8.sp, color = Color(0xFF64748B))
        Text(
            text = value,
            fontSize = 9.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium,
            color = Color(0xFF0F172A),
            lineHeight = 11.5.sp
        )
    }
}

@Composable
private fun TableRow(
    cant: String,
    code: String,
    desc: String,
    unid: String,
    unitPrice: String,
    alic: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(cant, fontSize = 8.sp, modifier = Modifier.width(26.dp), fontFamily = FontFamily.Monospace)
        Text(code, fontSize = 8.sp, modifier = Modifier.width(42.dp), fontFamily = FontFamily.Monospace, color = Color.Gray)
        Text(desc, fontSize = 8.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f), lineHeight = 10.sp)
        Text(unid, fontSize = 7.5.sp, color = Color.Gray, modifier = Modifier.width(34.dp))
        Text(unitPrice, fontSize = 8.sp, textAlign = TextAlign.End, modifier = Modifier.width(62.dp), fontFamily = FontFamily.Monospace)
        Text(alic, fontSize = 8.sp, textAlign = TextAlign.Center, modifier = Modifier.width(26.dp), fontFamily = FontFamily.Monospace)
    }
}

@Composable
private fun TotalLine(
    label: String,
    usdValue: String,
    bsValue: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp, vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 8.5.sp, color = Color(0xFF64748B))
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(usdValue, fontSize = 8.5.sp, color = Color(0xFF64748B), fontFamily = FontFamily.Monospace)
            Text(bsValue, fontSize = 8.5.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
        }
    }
}
