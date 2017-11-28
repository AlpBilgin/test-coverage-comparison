globalListe = [0];
class recurser {
  constructor(parent) {
    this.liste = [];
    if (parent) {
      this.liste = parent.liste.slice(0);
    }
  }
  walker() {
    if (globalListe.length > 10) {
      return;
    }
    globalListe.push(globalListe[globalListe.length - 1] + 1);
    this.liste.push(globalListe[globalListe.length - 2] + 1);
    (new recurser(this)).walker();
    console.log(this.liste);
  }
  whoIs() {
    console.log(this);
  }
}
(new recurser()).walker();
console.log(globalListe)