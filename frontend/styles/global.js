import { StyleSheet } from "react-native";

export const GlobalStyles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: 15,
    // paddingVertical: 16, // keeps top and bottom padding
    // paddingHorizontal: 8, // reduces left and right padding
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "	#d9d6d0",
    width: 150, // Fixed width
    height: 35, // Fixed height
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 2,
    shadowRadius: 6,

    // Shadow (Android)
    elevation: 12,
    // marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  primaryButton: {
    // backgroundColor: "#7928CA",
    backgroundColor: "#000000",
  },
  primaryButtonText: {
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#7928CA",
    borderWidth: 1,
    // borderColor: "#4361ee",
  },
  secondaryButtonText: {
    color: "#E5E7EB",
  },
  disabledButton: {
    borderRadius: 15,
    // paddingVertical: 12,
    // paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#cccccc",
    opacity: 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  disabledButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%", // Take full width
    marginVertical: 6, // Add vertical spacing
  },

  // Add other global styles as needed
});
