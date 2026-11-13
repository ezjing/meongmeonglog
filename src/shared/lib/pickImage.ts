import * as ImagePicker from 'expo-image-picker';

interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

const iosCompatibleAssetMode = ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible;

export async function pickImageFromLibrary(options: PickImageOptions = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing ?? false,
    aspect: options.aspect,
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
    selectionLimit: options.selectionLimit,
    quality: 0.8,
    preferredAssetRepresentationMode: iosCompatibleAssetMode,
  });

  if (result.canceled) return null;
  return result.assets.map((asset) => asset.uri);
}

export async function pickImageFromCamera(options: PickImageOptions = {}) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing ?? false,
    aspect: options.aspect,
    quality: 0.8,
    preferredAssetRepresentationMode: iosCompatibleAssetMode,
  });

  if (result.canceled) return null;
  return result.assets.map((asset) => asset.uri);
}
