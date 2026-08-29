package com.example.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val fullName: String,
    val rif: String,
    val email: String,
    val phone: String,
    val address: String = "",
    val isFreeTrial: Boolean = false,
    val trialStartDate: Long = System.currentTimeMillis(),
    val status: String = "ACTIVE", // ACTIVE, TRIAL, EXPIRED
    val planName: String = "Software Subscription",
    val monthlyPriceUsd: Double = 100.0
)
