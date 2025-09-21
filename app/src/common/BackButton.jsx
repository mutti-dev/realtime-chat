import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from '@react-navigation/native';

const BackButton = ({ size = 20, color = '#000', style }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={style}
    >
      <Icon name="arrow-left" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default BackButton;
