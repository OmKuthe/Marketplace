// app/customer/order-now.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createOrder } from '../../../lib/orders';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const colors = {
  primary: '#2874F0', // Flipkart blue
  secondary: '#FB641B', // Flipkart orange
  background: '#F1F3F6',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#878787',
  border: '#E0E0E0',
  success: '#388E3C',
  warning: '#FF9800'
};

type Address = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
};

type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';

export default function OrderNowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  console.log('Received params:', params);
  console.log('Product param:', params.product);
  
  // Get product data from params (passed from product page)
  const product = params.product ? JSON.parse(params.product as string) : null;
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saveAddress, setSaveAddress] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for new address
  const [newAddress, setNewAddress] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home' as 'home' | 'work' | 'other'
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [quantity, setQuantity] = useState(1);

// Update the useEffect to fetch customer address
useEffect(() => {
  const fetchCustomerData = async () => {
    if (!user?.uid) return;

    try {
      // Fetch customer data from Firestore
      const customerDoc = await getDoc(doc(db, 'customers', user.uid));
      
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        console.log('Customer data:', customerData);
        
        // Set the address from customer data
        if (customerData.address) {
          setNewAddress(prev => ({
            ...prev,
            address: customerData.address,
            name: customerData.fullName || user.displayName || '',
            phone: customerData.phone || user.phoneNumber || ''
          }));

          // Create a default address object from customer data
          const defaultAddress: Address = {
            id: 'default',
            name: customerData.fullName || user.displayName || 'Customer',
            phone: customerData.phone || user.phoneNumber || '',
            address: customerData.address || '',
            city: '', // You might want to extract these from the address string
            state: '', // Or add these fields to your customer collection
            pincode: '', // Or add these fields to your customer collection
            type: 'home',
            isDefault: true
          };

          setAddresses([defaultAddress]);
          setSelectedAddress(defaultAddress);
        }
      } else {
        console.log('No customer data found');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  fetchCustomerData();
}, [user?.uid]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalAmount = product.price * quantity;
  const deliveryCharge = totalAmount > 500 ? 0 : 40;
  const finalAmount = totalAmount + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!newAddress.phone || !newAddress.address || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      Alert.alert('Error', 'Please fill all address fields');
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        customerId: user?.uid || 'cust-001',
        customerName: selectedAddress.name,
        customerPhone: selectedAddress.phone,
        items: [{
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.imageUrl
        }],
        totalAmount: finalAmount,
        deliveryAddress: `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
        paymentMethod: paymentMethod,
        shopId: product.shopId || 'shop-001',
      };

      const orderId = await createOrder(orderData);
      
      Alert.alert(
        'Order Placed Successfully!',
        `Your order #${orderId} has been confirmed.`,
        [
          {
            text: 'View Order Details',
            onPress: () => router.push(`/orders/${orderId}`),
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.push('/customer/home'),
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const AddressCard = ({ address, isSelected }: { address: Address; isSelected: boolean }) => (
    <TouchableOpacity 
      style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
      onPress={() => setSelectedAddress(address)}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressType}>
          {address.type.toUpperCase()} {address.isDefault && '• DEFAULT'}
        </Text>
        <TouchableOpacity>
          <Text style={styles.editText}>EDIT</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.addressName}>{address.name}</Text>
      <Text style={styles.addressText}>{address.address}</Text>
      <Text style={styles.addressText}>{address.city}, {address.state} - {address.pincode}</Text>
      <Text style={styles.addressPhone}>Phone: {address.phone}</Text>
      
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.selectedText}>Delivery Address</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const PaymentOption = ({ method, icon, title, description }: {
    method: PaymentMethod;
    icon: string;
    title: string;
    description: string;
  }) => (
    <TouchableOpacity 
      style={[styles.paymentOption, paymentMethod === method && styles.selectedPaymentOption]}
      onPress={() => setPaymentMethod(method)}
    >
      <View style={styles.paymentLeft}>
        <Text style={styles.paymentIcon}>{icon}</Text>
        <View>
          <Text style={styles.paymentTitle}>{title}</Text>
          <Text style={styles.paymentDescription}>{description}</Text>
        </View>
      </View>
      <View style={[styles.radioButton, paymentMethod === method && styles.radioButtonSelected]}>
        {paymentMethod === method && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.productCard}>
            <Image 
              source={{ uri: product.imageUrl || 'https://via.placeholder.com/80' }} 
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productSeller}>Seller: {product.shopName || 'Local Store'}</Text>
              <View style={styles.priceQuantity}>
                <Text style={styles.productPrice}>₹{product.price}</Text>
                <View style={styles.quantitySelector}>
                  <Text style={styles.quantityLabel}>Qty: </Text>
                  <TouchableOpacity 
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Text style={styles.quantityBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddressForm(!showAddressForm)}
            >
              <Text style={styles.addButtonText}>
                {showAddressForm ? 'CANCEL' : '+ ADD NEW ADDRESS'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* New Address Form */}
          {showAddressForm && (
            <View style={styles.addressForm}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={newAddress.name}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, name: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={newAddress.phone}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Address (House No, Building, Street)"
                value={newAddress.address}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, address: text }))}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City"
                  value={newAddress.city}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="State"
                  value={newAddress.state}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                value={newAddress.pincode}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, pincode: text }))}
                keyboardType="number-pad"
              />
              
              <View style={styles.addressTypeSelector}>
                <Text style={styles.typeLabel}>Address Type:</Text>
                {(['home', 'work', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, newAddress.type === type && styles.typeButtonSelected]}
                    onPress={() => setNewAddress(prev => ({ ...prev, type }))}
                  >
                    <Text style={[styles.typeButtonText, newAddress.type === type && styles.typeButtonTextSelected]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.saveAddressOption}>
                <Switch
                  value={saveAddress}
                  onValueChange={setSaveAddress}
                  trackColor={{ false: '#767577', true: colors.primary }}
                />
                <Text style={styles.saveAddressText}>Save this address for future</Text>
              </View>

              <TouchableOpacity style={styles.saveAddressButton}>
                <Text style={styles.saveAddressButtonText}>SAVE ADDRESS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Addresses */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addressesScroll}>
            <View style={styles.addressesContainer}>
              {addresses.map((address) => (
                <AddressCard 
                  key={address.id} 
                  address={address} 
                  isSelected={selectedAddress?.id === address.id}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <PaymentOption
            method="cash"
            icon="💵"
            title="Cash on Delivery"
            description="Pay when you receive the order"
          />
          
          <PaymentOption
            method="upi"
            icon="📱"
            title="UPI"
            description="Pay using UPI apps"
          />
          
          <PaymentOption
            method="card"
            icon="💳"
            title="Credit/Debit Card"
            description="Pay using your card"
          />
          
          <PaymentOption
            method="wallet"
            icon="👛"
            title="Wallet"
            description="Pay using your wallet"
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price ({quantity} items)</Text>
            <Text style={styles.priceValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceValue}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </Text>
          </View>
          {deliveryCharge === 0 && (
            <Text style={styles.freeDeliveryText}>You saved ₹40 on delivery!</Text>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{finalAmount}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By placing this order, you agree to our Terms of Service and Privacy Policy.
            Your order will be delivered within 2-3 business days.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerAmount}>₹{finalAmount}</Text>
          <Text style={styles.footerText}>Total payable</Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              PLACE ORDER
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop:20,
    paddingBottom:36
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    marginVertical: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productSeller: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quantityBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityValue: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 12,
  },
  addressForm: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  addressTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
  },
  saveAddressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveAddressText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  saveAddressButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveAddressButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  addressesScroll: {
    marginHorizontal: -16,
  },
  addressesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  addressCard: {
    width: 280,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7ff',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressType: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  editText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPaymentOption: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7ff',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  priceValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  freeDeliveryText: {
    fontSize: 12,
    color: colors.success,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  termsSection: {
    backgroundColor: colors.surface,
    padding: 16,
    marginVertical: 8,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSummary: {
    flex: 1,
  },
  footerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  placeOrderButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 140,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  placeOrderButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  backButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
});