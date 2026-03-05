// import Swal from "sweetalert2";
import { EncryptStorage } from 'encrypt-storage';
const encryptStorage = new EncryptStorage(import.meta.env.VITE_ENCRYPT_STORAGE);

export function dateTime(time:string) {
 return tryCatch(() => {
   if(`${time}`.trim()?.length>3) return ''


  const date = new Date(time);
  const formatted = date.toISOString().replace("T", " ").substring(0, 19);
  return formatted

  });
}
export function date(time:string) {
 return tryCatch(() => {
  if(`${time}`.trim()?.length>3) return ''

  const date = new Date(time);
  const formatted = date.toISOString().split('T')[0];
  return formatted

  });
}

// ============================================================

const keysToUse = {
  userPermissions: 'userPermissions',
  loginUserData: 'loginUserData',
  loggedInAsStudentOrStaff: 'loggedInAsStudentOrStaff',
  IpEverLoged: "IpEverLoged"

  };
/***
 * ****/
export  function tryCatch<T>(callback: () => Promise<T> | T) {
  try {
    return  callback();
  } catch (error) {
    console.error(error);
    return null;
  }
}



export function storeUserLogedinData(data:any, key:string="loginUserData") {
  try {
    encryptStorage.setItem(keysToUse[key as keyof typeof keysToUse] , data);

  } catch (error) {
    console.error(`Failed to store key "${keysToUse[key as keyof typeof keysToUse]}":`, error);
    return false;
  }
}
export function setIpEverLoged(data:any, ):void {
  try {
    encryptStorage.setItem(keysToUse["IpEverLoged"] , data);

  } catch (error) {
    console.error(`Failed to store key "${keysToUse["IpEverLoged"]}":`, error);

  }
}
export function getIpEverLoged() {
  try {
  return  encryptStorage.getItem(keysToUse["IpEverLoged"] );

  } catch (error) {
    console.error(`Failed to store key "${keysToUse["IpEverLoged"]}":`, error);
    return false;
  }
}

export function removeKey(key: string) {
  try {
    encryptStorage.removeItem(keysToUse[key as keyof typeof keysToUse]);
    return true;
  } catch (error) {
    console.error(`Failed to remove key "${keysToUse}":`, error);
    return false;
  }
}
export function logoutUser( navigate:any) {
  try {
    removeKey("userPermissions");
    removeKey("loginUserData");
    navigate("/login");
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export function getUserData() {
  try {
    const data = (encryptStorage.getItem(keysToUse['loginUserData']));
    return data || {};
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return {};
  }
}



export function getUserToken() {
  try {
    const userData = getUserData();
    return userData?.token ?? null;
  } catch (error) {
    console.error(error, '009');

  }
}

export function logoutUserTokenExpireTime(navigate:any) {

  const timestamp = getUserTokenExpireTime();
  const currentTime = Date.now(); 
  if (currentTime >= (timestamp)) {
    logoutUser(navigate);
  }
}

export function getUserTokenExpireTime() {
  const userData = getUserData();
  return userData?.expiresIn ?? null;
}
 
export function storeUserCretiria(data = null) {
  try {
    encryptStorage.setItem("userCreatiria", JSON.stringify(data));
  } catch (error) {
    console.error('Error storing user permissions:', error);
  }
}
export function storeUserPermissions(props: { data: any } = { data: null }) {
  const { data } = props;

  try {
    encryptStorage.setItem("userPermissions", JSON.stringify(data));
  } catch (error) {
    console.error('Error storing user permissions:', error);
  }
}



/////////

 
export function addCommasCurrency(number:any, delimeter = ",") {
  return `${number}`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimeter);
}
export function addMinutesToTime(startTime: string, minutesToAdd:number|string = 40) {
  const [hours = 0, minutes = 0] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + parseFloat(minutesToAdd); // add 50 minutes
  const endHours = Math.floor(totalMinutes / 60) % 24; // keep within 24h
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
}

 

export async function downloadFile(url: string, Action = "download", type = "pdf") {
  const appName = import.meta.env.VITE_APP_NAME; // Example of accessing environment variable
  const valueres = await customAxios.get(url, { responseType: "blob" });
  const fileType: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xslx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    txt: "text/plain",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
  };
  const filename = `${appName}${Date.now()}.` + type;
  const blob = new Blob([valueres.data], {
    type: fileType[type] || "application/octet-stream",
  });
  const blobUrl = window.URL.createObjectURL(blob);

  if (Action === "download") downloadPDF(blobUrl, filename);
  else {
    downloadPDF(url, filename);
    return blobUrl;
  }

}

 
 
export function viewPDF(url:any) {
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.width = "100%";
  iframe.style.height = "600px";
  document.body.appendChild(iframe);
}
export function downloadPDF(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename); // Set the file name
  document.body.appendChild(link);
  link.click(); // Trigger the download
  document.body.removeChild(link); // Clean up
  window.URL.revokeObjectURL(url);
}
export function NameInitials(strings: string) {
  if (!strings || typeof strings !== "string") return "";

  const parts = strings.trim().split(/\s+/); // handles multiple spaces
  if (parts.length === 0) return "";

  const firstInitial = parts[0]?.[0]?.toUpperCase() || "";
  const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase() || "";

  return firstInitial + lastInitial;
}

 
 

 
 
 
 
export function isJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (e) { }
  return jsonString;
}
 

 
 


export function formDataFormat(data:any) {
  let formData = new FormData();

  // console.log(data)
  for (let key in data) {
    let value = data[key];

    if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((element, index) => {
        if (
          element &&
          typeof element === "object" &&
          element.file instanceof File
        ) {
          formData.append(`${key}[${index}]`, element.file); // Use index for clarity
        } else if (
          element &&
          typeof element === "object" &&
          element?.lastModified &&
          element?.name &&
          element?.lastModifiedDate &&
          element?.type
        ) {
          formData.append(`${key}[${index}]`, element); // Use index for clarity
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(element));
        }
      });
    } else if (typeof value === "object" && !(value instanceof File)) {
      formData.append(`${key}`, JSON.stringify(value));
    } else {
      // Handle primitive values and Files
      formData.append(key, value);
    }
  }

  return formData;
}


 


