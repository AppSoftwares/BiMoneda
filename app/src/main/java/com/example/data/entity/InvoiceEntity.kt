package com.example.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invoiceNumber: String,
    val controlNumber: String,
    val clientId: Long = 0,
    val clientName: String,
    val clientRif: String,
    val clientAddress: String,
    val clientPhone: String,
    val issueDate: String, // e.g. "06/04/2026"
    val issueTime: String, // e.g. "04:39:54 p.m."
    val concept: String,
    val serviceCode: String = "IS0071",
    val serviceUnit: String = "UNIDAD",
    val quantity: Int = 1,
    val bcvRate: Double, // e.g. 474.0598 or 36.00
    val subtotalUsd: Double,
    val subtotalBs: Double,
    val exemptUsd: Double = 0.0,
    val exemptBs: Double = 0.0,
    val taxableBaseUsd: Double,
    val taxableBaseBs: Double,
    val ivaRatePercent: Double = 16.0,
    val ivaUsd: Double,
    val ivaBs: Double,
    val igtfRatePercent: Double = 0.0, // 3% if paid in USD/divisas
    val igtfUsd: Double = 0.0,
    val igtfBs: Double = 0.0,
    val totalUsd: Double,
    val totalBs: Double,
    val paymentMethod: String = "Zelle", // Zelle, Pago Móvil, Transfer, Cash USD
    val referenceNumber: String = "",
    val status: String = "PAID", // PAID, PENDING, CANCELLED
    val paymentCondition: String = "CONTADO",
    val saleType: String = "INTERNA",
    val observations: String = "Comisiones Varias"
)
