import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { routeByUserType, useAuth } from "@/lib/auth";

export default function Index() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (user) {
    return <Redirect href={routeByUserType(user.tipo_user)} />;
  }

  return <Redirect href="/login" />;
}
