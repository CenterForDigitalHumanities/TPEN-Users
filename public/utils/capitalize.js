export default function capitalizeName(name) {
  // finds the appearance of tpen in any string given as name. returns name with tpen capitalized. e.g tpen_public_user would be returned as TPEN public user
  
  if (!name) return

  let tempName = name.includes("_") ? name.split("_") : name.split(" ")

  for (let i = 0; i < tempName.length; i++) {
    if (tempName[i] == "tpen") {
      tempName[i] = "TPEN"
    }
  }
  return tempName.join(" ")
}
