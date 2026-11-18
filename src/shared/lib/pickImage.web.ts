interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

/**
 * Safari는 사용자 탭이 끝난 뒤(await 이후)에는 파일 창을 열지 않는다.
 * 권한 요청 없이, 탭 처리 안에서 input.click()을 바로 호출한다.
 * 창이 뜨는 동안 페이지 포커스가 왔다 갔다 하므로, 포커스로 취소를 판단하지 않는다.
 * 파일 창은 장수 제한을 받지 않는다. 고른 사진을 모두 돌려주고, 상한은 호출하는 화면이 자른다.
 * 자르기(allowsEditing)는 웹 파일 창에 없어서 원본을 그대로 받는다.
 */
function openImageInput(options: {
  capture: boolean;
  allowsMultipleSelection: boolean;
}): Promise<string[] | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = options.allowsMultipleSelection;
  if (options.capture) input.setAttribute('capture', 'environment');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.opacity = '0';
  document.body.appendChild(input);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (uris: string[] | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(uris);
    };

    input.addEventListener('change', () => {
      const files = input.files ? Array.from(input.files) : [];
      const uris = files
        .filter((file) => file.type === '' || file.type.startsWith('image/'))
        .map((file) => URL.createObjectURL(file));
      finish(uris.length > 0 ? uris : null);
    });
    input.addEventListener('cancel', () => finish(null));
    input.click();
  });
}

export function pickImageFromLibrary(options: PickImageOptions = {}): Promise<string[] | null> {
  return openImageInput({
    capture: false,
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
  });
}

export function pickImageFromCamera(_options: PickImageOptions = {}): Promise<string[] | null> {
  return openImageInput({
    capture: true,
    allowsMultipleSelection: false,
  });
}
