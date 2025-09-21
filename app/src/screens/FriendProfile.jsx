import { StyleSheet, Text, View, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import Thumbnail from '../common/Thumbnail';
import utils from '../core/utils';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../common/BackButton';
import { LinearGradient } from 'expo-linear-gradient'



const { width } = Dimensions.get('window');

const FriendProfile = ({ route }) => {
  const { details } = route.params;
  const theme = useTheme();
  const navigation = useNavigation();
  const styles = getStyles(theme);

  const getStatusText = () => {
    if (details.is_online) return 'Online';
    if (details.last_online) return `Last online: ${utils.formatTime(details.last_online)}`;
    return 'Offline';
  };

  const getStatusColor = () => {
    return details.is_online ? '#4CAF50' : theme.colors.placeholder;
  };

  return (
    <View style={styles.container}>




      {/* Gradient Header Background */}
      <View style={styles.headerBackground} />


      <LinearGradient
        colors={[theme.colors.background, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          paddingTop: 40,
          paddingBottom: 14,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,

        }}
      >
        <StatusBar barStyle="transparent" />
        <BackButton color={theme.colors.text} size={24} style={{ marginLeft: 10 }} />
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <Thumbnail
                url={details.thumbnail}
                size={120}
                placeholder={details.name}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{details.name}</Text>
            <Text style={styles.username}>@{details.username}</Text>

            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        </View>


      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
          </View>

          <View style={styles.detailsContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{details.name}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>@{details.username}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusDetail}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.detailValue}>{getStatusText()}</Text>
              </View>
            </View>

            {details.bio && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bio</Text>
                  <Text style={styles.bioText}>{details.bio}</Text>
                </View>
              </>
            )}

            {details.joined_date && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>{utils.formatDate(details.joined_date)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Activity Card */}
        {(details.total_messages || details.last_message_time) && (
          <View style={styles.activityCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Activity</Text>
            </View>

            <View style={styles.detailsContent}>
              {details.total_messages && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Messages</Text>
                  <Text style={styles.detailValue}>{details.total_messages.toLocaleString()}</Text>
                </View>
              )}

              {details.total_messages && details.last_message_time && (
                <View style={styles.divider} />
              )}

              {details.last_message_time && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Last Message</Text>
                  <Text style={styles.detailValue}>{utils.formatTime(details.last_message_time)}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerBackground: {
      position: 'absolute',
      top: 80,
      left: 0,
      right: 0,
      height: 100,

      opacity: 0.3,
    },
    navigationHeader: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 1000,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.level3,
      alignItems: 'left',
      justifyContent: 'left',
    },
    backIconContainer: {
      alignItems: 'left',
      justifyContent: 'left',
    },
    backIcon: {
      fontSize: 24,
      color: theme.colors.text,
      fontWeight: '300',

    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.title,
      letterSpacing: -0.3,
    },
    headerPlaceholder: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    header: {
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    avatarSection: {
      alignItems: 'center',
    },
    avatarContainer: {
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarBorder: {
      borderRadius: 70,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      padding: 4,
      backgroundColor: theme.colors.level3,
    },
    profileInfo: {
      alignItems: 'center',
      width: '100%',
    },
    name: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.title,
      marginBottom: 4,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    username: {
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
      opacity: 0.8,
      fontWeight: '500',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.level3,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    detailsCard: {
      backgroundColor: theme.colors.level3,
      top: 10,
      marginHorizontal: 10,
      marginBottom: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    activityCard: {
      backgroundColor: theme.colors.level3,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    cardHeader: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.title,
      letterSpacing: -0.3,
    },
    detailsContent: {
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    detailItem: {
      paddingVertical: 16,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailValue: {
      fontSize: 17,
      color: theme.colors.text,
      fontWeight: '600',
    },
    bioText: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      fontWeight: '400',
    },
    statusDetail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 8,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
  });
}

export default FriendProfile