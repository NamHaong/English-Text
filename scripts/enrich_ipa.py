import cmudict
import json

ARPABET_TO_IPA = {
    'AA': 'ɑ', 'AA0': 'ɑ', 'AA1': 'ˈɑ', 'AA2': 'ˌɑ',
    'AE': 'æ', 'AE0': 'æ', 'AE1': 'ˈæ', 'AE2': 'ˌæ',
    'AH': 'ʌ', 'AH0': 'ə', 'AH1': 'ˈʌ', 'AH2': 'ˌʌ',
    'AO': 'ɔ', 'AO0': 'ɔ', 'AO1': 'ˈɔ', 'AO2': 'ˌɔ',
    'AW': 'aʊ', 'AW0': 'aʊ', 'AW1': 'ˈaʊ', 'AW2': 'ˌaʊ',
    'AY': 'aɪ', 'AY0': 'aɪ', 'AY1': 'ˈaɪ', 'AY2': 'ˌaɪ',
    'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð',
    'EH': 'e', 'EH0': 'e', 'EH1': 'ˈe', 'EH2': 'ˌe',
    'ER': 'ɜːr', 'ER0': 'ər', 'ER1': 'ˈɜːr', 'ER2': 'ˌɜːr',
    'EY': 'eɪ', 'EY0': 'eɪ', 'EY1': 'ˈeɪ', 'EY2': 'ˌeɪ',
    'F': 'f', 'G': 'ɡ', 'HH': 'h',
    'IH': 'ɪ', 'IH0': 'ɪ', 'IH1': 'ˈɪ', 'IH2': 'ˌɪ',
    'IY': 'i', 'IY0': 'i', 'IY1': 'ˈi', 'IY2': 'ˌi',
    'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ',
    'OW': 'oʊ', 'OW0': 'oʊ', 'OW1': 'ˈoʊ', 'OW2': 'ˌoʊ',
    'OY': 'ɔɪ', 'OY0': 'ɔɪ', 'OY1': 'ˈɔɪ', 'OY2': 'ˌɔɪ',
    'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ',
    'UH': 'ʊ', 'UH0': 'ʊ', 'UH1': 'ˈʊ', 'UH2': 'ˌʊ',
    'UW': 'u', 'UW0': 'u', 'UW1': 'ˈu', 'UW2': 'ˌu',
    'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
}

def to_ipa(phonemes):
    res = ''
    stress = ''
    for ph in phonemes:
        converted = ARPABET_TO_IPA.get(ph, ph.lower())
        if 'ˈ' in converted:
            stress = 'ˈ'
            converted = converted.replace('ˈ', '')
        elif 'ˌ' in converted:
            stress = 'ˌ'
            converted = converted.replace('ˌ', '')
        
        if stress and converted in 'aeiouɑæʌəɔʊ':
            res += stress + converted
            stress = ''
        else:
            res += converted
    return f"/{res}/"

cmu = cmudict.dict()

with open('src/data/vocabulary.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

updated = 0
for item in vocab:
    w = item['word'].lower().split(',')[0].strip()
    placeholder = f"/{item['word']}/"
    placeholder_clean = f"/{w}/"
    if item['ipa'] == placeholder or item['ipa'] == placeholder_clean or not item['ipa']:
        if w in cmu:
            item['ipa'] = to_ipa(cmu[w][0])
            updated += 1

with open('src/data/vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2)

print(f"Updated IPA for {updated} words in vocabulary.json. Total words: {len(vocab)}")
