import React from 'react';
import { View, Text } from 'react-native';
import { FareInfo } from '../../../shared/types/driver';
import { fareStyles } from '../styles';

interface FareItemProps {
  fare: FareInfo;
}

export const FareItem: React.FC<FareItemProps> = ({ fare }) => {
  return (
    <View style={fareStyles.fareItem}>
      <View>
        <Text style={fareStyles.fareFrom}>{fare.from}</Text>
        <Text style={fareStyles.fareTo}>to {fare.to}</Text>
      </View>
      <Text style={fareStyles.fareAmount}>₱{fare.fare}</Text>
    </View>
  );
};