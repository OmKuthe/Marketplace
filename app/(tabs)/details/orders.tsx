// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
// import { collection, getDocs } from 'firebase/firestore';
// // import { db } from '../config/firebase'; // adjust your path
// import { db } from '../../../firebaseConfig';


// const Offers = () => {
//   const [offers, setOffers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchOffers = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, 'offers'));
//         const offerList: any[] = [];
//         querySnapshot.forEach((doc) => {
//           offerList.push({ id: doc.id, ...doc.data() });
//         });
//         setOffers(offerList);
//       } catch (error) {
//         console.error('Error fetching offers:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOffers();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       {offers.map((offer) => (
//         <View key={offer.id} style={styles.card}>
//           <Image source={{ uri: offer.imageUrl }} style={styles.image} />
//           <View style={styles.textContainer}>
//             <Text style={styles.title}>{offer.title}</Text>
//             <Text style={styles.desc}>{offer.description}</Text>

//             <View style={styles.row}>
//               <Text style={styles.label}>Category: </Text>
//               <Text style={styles.value}>{offer.category}</Text>
//             </View>

//             <View style={styles.row}>
//               <Text style={styles.label}>Shop: </Text>
//               <Text style={styles.value}>{offer.shopName}</Text>
//             </View>

//             <View style={styles.row}>
//               <Text style={styles.label}>Shopkeeper: </Text>
//               <Text style={styles.value}>{offer.shopkeeperName}</Text>
//             </View>

//             <View style={styles.priceContainer}>
//               <Text style={styles.originalPrice}>₹{offer.originalPrice}</Text>
//               <Text style={styles.discountPrice}>₹{offer.discountPrice}</Text>
//             </View>

//             <Text style={styles.expiry}>Expires on: {offer.expiryDate}</Text>
//             <Text style={styles.location}>
//               📍 {offer.location}
//             </Text>
//           </View>
//         </View>
//       ))}
//     </ScrollView>
//   );
// };

// export default Offers;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFAFA',
//     padding: 10,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     marginBottom: 20,
//     overflow: 'hidden',
//     elevation: 4,
//   },
//   image: {
//     width: '100%',
//     height: 200,
//   },
//   textContainer: {
//     padding: 12,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   desc: {
//     color: '#666',
//     marginBottom: 8,
//   },
//   row: {
//     flexDirection: 'row',
//   },
//   label: {
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   value: {
//     color: '#555',
//   },
//   priceContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 8,
//   },
//   originalPrice: {
//     textDecorationLine: 'line-through',
//     color: '#999',
//     marginRight: 8,
//   },
//   discountPrice: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#E53935',
//   },
//   expiry: {
//     color: '#FF6F00',
//     marginBottom: 4,
//   },
//   location: {
//     color: '#0288D1',
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });


import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const Offers = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to format Firestore Timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'No expiry date';
    
    try {
      if (timestamp.seconds && timestamp.nanoseconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      
      return 'No expiry date';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'No expiry date';
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'offers'));
        const offerList: any[] = [];
        querySnapshot.forEach((doc) => {
          offerList.push({ id: doc.id, ...doc.data() });
        });
        setOffers(offerList);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Special Offers</Text>
        <Text style={styles.headerSubtitle}>{offers.length} offers available</Text>
      </View>
      
      {offers.map((offer) => {
        const discountPercentage = Math.round((1 - offer.discountPrice / offer.originalPrice) * 100);
        
        return (
          <View key={offer.id} style={styles.card}>
            <Image source={{ uri: offer.imageUrl }} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{offer.title}</Text>
              <Text style={styles.desc}>{offer.description}</Text>

              <View style={styles.pricingRow}>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>₹{offer.originalPrice}</Text>
                  <Text style={styles.discountPrice}>₹{offer.discountPrice}</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPercentage}% OFF</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Shop: </Text>
                  <Text style={styles.value}>{offer.shopName}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Category: </Text>
                  <Text style={styles.value}>{offer.category}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.label}>Expires: </Text>
                  <Text style={styles.value}>{formatTimestamp(offer.expiryDate)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.label}>Location: </Text>
                  <Text style={styles.value}>📍 {offer.location}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default Offers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 200,
  },
  textContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1e293b',
  },
  desc: {
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    marginRight: 8,
    fontSize: 16,
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  discountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsGrid: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    color: '#334155',
    width: 80,
  },
  value: {
    color: '#475569',
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});