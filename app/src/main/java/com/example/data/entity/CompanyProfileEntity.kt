package com.example.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "company_profile")
data class CompanyProfileEntity(
    @PrimaryKey
    val id: Int = 1,
    val companyName: String = "MERCOSUR CASA DE BOLSA S.A",
    val slogan: String = "TU CASA DE BOLSA",
    val rif: String = "J-304554141",
    val address: String = "AV VENEZUELA CON CALLE MOHEDANO EDIF TORRE JWM PISO SEIS (06) OF 1 URB EL ROSAL CARACAS (CHACAO) MIRANDA ZONA POSTAL 1060",
    val phone: String = "0212 952 41 65",
    val email: String = "negocios@mercosur.com.ve",
    val economicActivityCode: String = "9499",
    val bcvRate: Double = 474.0598,
    val signatureName: String = "Elena Petrova",
    val signatureSvg: String = "", // custom points if drawn
    val isDarkMode: Boolean = false,
    val language: String = "Spanish" // Spanish or English
)
