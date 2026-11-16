interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

const CANCEL_GRACE_MS = 500;

/**
 * Safari는 사용자 탭이 끝난 뒤(await 이후)에는 파일 창을 열지 않는다.
 * 권한 요청 없이, 탭 처리 안에서 input.click()을 바로 호출한다.
 * 자르기(allowsEditing)는 웹 파일 창에 없어서 원본을 그대로 받는다.
 */
function openImageInput(options: {
  capture: boolean;
  allowsMultipleSelection: boolean;
  selectionLimit?: number;
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
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(uris);
    };

    const onFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, CANCEL_GRACE_MS);
    };

    const onBlur = () => {
      window.addEventListener('focus', onFocus);
    };

    input.addEventListener('change', () => {
      const files = input.files ? Array.from(input.files) : [];
      const limited =
        options.selectionLimit != null ? files.slice(0, options.selectionLimit) : files;
      const uris = limited
        .filter((file) => file.type === '' || file.type.startsWith('image/'))
        .map((file) => URL.createObjectURL(file));
      finish(uris.length > 0 ? uris : null);
    });
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener('blur', onBlur);
    input.click();
  });
}

export function pickImageFromLibrary(options: PickImageOptions = {}): Promise<string[] | null> {
  return openImageInput({
    capture: false,
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
    selectionLimit: options.selectionLimit,
  });
}

export function pickImageFromCamera(_options: PickImageOptions = {}): Promise<string[] | null> {
  return openImageInput({
    capture: true,
    allowsMultipleSelection: false,
    selectionLimit: 1,
  });
}
