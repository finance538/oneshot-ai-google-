package com.example.oneshot.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.data.model.ServiceProduct
import com.example.oneshot.data.repository.CatalogRepository
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.viewmodel.OneShotViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorefrontScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedProduct by viewModel.selectedProduct.collectAsState()
    val walletState by viewModel.walletState.collectAsState()

    val filteredProducts = CatalogRepository.products.filter { product ->
        val matchesCategory = selectedCategory == "ALL" || product.categoryId == selectedCategory
        val matchesSearch = searchQuery.isBlank() ||
                product.nameAr.contains(searchQuery, ignoreCase = true) ||
                product.nameEn.contains(searchQuery, ignoreCase = true) ||
                product.shortDescription.contains(searchQuery, ignoreCase = true) ||
                product.sku.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesSearch
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
    ) {
        // Search Field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { viewModel.setSearchQuery(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .testTag("search_field"),
            placeholder = { Text("ابحث في خدمات ونشوت (أتمتة، تصوير، هوية...)", fontSize = 12.sp) },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "بحث",
                    tint = NeutralMuted
                )
            },
            singleLine = true,
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = NeutralWhite,
                unfocusedContainerColor = NeutralWhite,
                focusedBorderColor = FlameOrange,
                unfocusedBorderColor = NeutralBorder
            )
        )

        // Categories horizontal chip row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CatalogRepository.categories.forEach { category ->
                val isSelected = selectedCategory == category.id
                FilterChip(
                    selected = isSelected,
                    onClick = { viewModel.selectCategory(category.id) },
                    label = {
                        Text(
                            text = category.nameAr,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = FlameOrange,
                        selectedLabelColor = NeutralWhite,
                        containerColor = NeutralWhite,
                        labelColor = ObsidianBlack
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isSelected,
                        borderColor = NeutralBorder,
                        selectedBorderColor = FlameOrange
                    ),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.testTag("category_chip_${category.id}")
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Product Catalog List
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "الخدمات المتاحة (${filteredProducts.size})",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )
                    Text(
                        text = "أسعار شاملة بالريال السعودي",
                        fontSize = 10.sp,
                        color = NeutralMuted
                    )
                }
            }

            items(filteredProducts, key = { it.sku }) { product ->
                ProductCard(
                    product = product,
                    onClick = { viewModel.selectProduct(product) },
                    onBuyClick = { viewModel.purchaseProduct(product) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Product Detail Bottom Sheet
    if (selectedProduct != null) {
        val prod = selectedProduct!!
        ModalBottomSheet(
            onDismissRequest = { viewModel.selectProduct(null) },
            containerColor = NeutralWhite,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = prod.sku,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = FlameOrange
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = prod.subCategory,
                                fontSize = 10.sp,
                                color = NeutralMuted
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = prod.nameAr,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = ObsidianBlack
                        )
                        Text(
                            text = prod.nameEn,
                            fontSize = 12.sp,
                            color = NeutralMuted
                        )
                    }
                    IconButton(onClick = { viewModel.selectProduct(null) }) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق")
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Price & Delivery Banner
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp)),
                    color = FlameSoft
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("السعر الإجمالي", fontSize = 10.sp, color = FlameOrange)
                            Text(
                                text = "${String.format(java.util.Locale.US, "%,.0f", prod.amount)} ر.س",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = FlameOrange
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("مدة التسليم", fontSize = 10.sp, color = FlameOrange)
                            Text(
                                text = "${prod.deliveryDays} أيام عمل",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = ObsidianBlack
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "تفاصيل الخدمة:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = prod.detailedDescription,
                    fontSize = 11.sp,
                    lineHeight = 18.sp,
                    color = Color(0xFF4A4E50)
                )

                if (prod.deliverables.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "مخرجات العمل المسلمة:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    prod.deliverables.forEach { item ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = item, fontSize = 11.sp, color = ObsidianBlack)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Actions: Buy with wallet vs direct payment
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { viewModel.purchaseProduct(prod) },
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("buy_from_wallet_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("ادفع من المحفظة", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            viewModel.createPaymentDocument(
                                title = prod.nameAr,
                                customerName = "عميل ونشوت",
                                customerEmail = "client@oneshot.sa",
                                amount = prod.amount,
                                method = com.example.oneshot.data.model.PaymentMethod.HOSTED,
                                gateway = "paytabs"
                            )
                            viewModel.selectProduct(null)
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("direct_checkout_button"),
                        colors = ButtonDefaults.buttonColors(containerColor = ObsidianBlack),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("إنشاء طلب دفع", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun ProductCard(
    product: ServiceProduct,
    onClick: () -> Unit,
    onBuyClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("product_card_${product.sku}"),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = NeutralWhite),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFF222727))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = product.sku,
                            color = NeutralWhite,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = product.subCategory,
                        fontSize = 10.sp,
                        color = NeutralMuted
                    )
                }
                if (product.tag != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(FlameSoft)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = product.tag,
                            color = FlameOrange,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = product.nameAr,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = ObsidianBlack
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = product.shortDescription,
                fontSize = 11.sp,
                color = Color(0xFF6B7275),
                lineHeight = 16.sp,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.Baseline) {
                    Text(
                        text = "${String.format(java.util.Locale.US, "%,.0f", product.amount)}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = FlameOrange
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(text = "ر.س", fontSize = 10.sp, color = NeutralMuted)
                }

                Button(
                    onClick = onBuyClick,
                    colors = ButtonDefaults.buttonColors(containerColor = ObsidianBlack),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier
                        .height(34.dp)
                        .testTag("quick_buy_${product.sku}")
                ) {
                    Text("شراء الخدمة", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
