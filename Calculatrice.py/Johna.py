import tkinter as tk

# ─────────────────────────────────────────────────────────────────────────────
#  CONSTANTES DE STYLE  (thème blanc)
# ─────────────────────────────────────────────────────────────────────────────
BG        = "#f2f2f2"
WHITE     = "#ffffff"
BTN_LIGHT = "#ffffff"
BTN_DARK  = "#d4d4d2"
BTN_OP    = "#ff9500"
BTN_CONV  = "#007aff"
FG_MAIN   = "#1a1a1a"
FG_DIM    = "#888888"
FG_WHITE  = "#ffffff"
BORDER    = "#cccccc"

# ─────────────────────────────────────────────────────────────────────────────
#  FENÊTRE
# ─────────────────────────────────────────────────────────────────────────────
root = tk.Tk()
root.title("Calculatrice")
root.configure(bg=BG)
root.resizable(False, False)

# ─────────────────────────────────────────────────────────────────────────────
#  ÉTAT
# ─────────────────────────────────────────────────────────────────────────────
expression      = ""
resultat_affich = "0"
new_number      = True
mode            = tk.StringVar(value="CALC")
base_source     = tk.StringVar(value="DEC")
base_dest       = tk.StringVar(value="BIN")

# ─────────────────────────────────────────────────────────────────────────────
#  LOGIQUE CALCULATRICE
# ─────────────────────────────────────────────────────────────────────────────
def appuyer_chiffre(c):
    global resultat_affich, new_number
    if new_number:
        resultat_affich = c
        new_number = False
    else:
        if resultat_affich == "0" and c != ".":
            resultat_affich = c
        else:
            if c == "." and "." in resultat_affich:
                return
            resultat_affich += c
    rafraichir_affichage()

def appuyer_op(op):
    global expression, resultat_affich, new_number
    expression = resultat_affich + " " + op + " "
    lbl_expr.config(text=expression)
    new_number = True
    rafraichir_affichage()

def calculer():
    global expression, resultat_affich, new_number
    try:
        expr_complete = expression + resultat_affich
        lbl_expr.config(text=expr_complete + " =")
        res = eval(expr_complete)
        if res == int(res):
            res = int(res)
        resultat_affich = str(res)
        expression = ""
        new_number = True
    except Exception:
        resultat_affich = "Erreur"
        expression = ""
        new_number = True
    rafraichir_affichage()

def effacer_tout():
    global expression, resultat_affich, new_number
    expression = ""
    resultat_affich = "0"
    new_number = True
    lbl_expr.config(text="")
    rafraichir_affichage()

def backspace():
    global resultat_affich, new_number
    if new_number:
        return
    resultat_affich = resultat_affich[:-1] or "0"
    rafraichir_affichage()

def plus_moins():
    global resultat_affich
    if resultat_affich.startswith("-"):
        resultat_affich = resultat_affich[1:]
    elif resultat_affich != "0":
        resultat_affich = "-" + resultat_affich
    rafraichir_affichage()

def pourcentage():
    global resultat_affich
    try:
        v = float(resultat_affich) / 100
        resultat_affich = str(int(v) if v == int(v) else v)
    except Exception:
        pass
    rafraichir_affichage()

def rafraichir_affichage():
    t = resultat_affich
    if len(t) > 10:
        lbl_result.config(font=("Helvetica Neue", 26, "bold"))
    elif len(t) > 7:
        lbl_result.config(font=("Helvetica Neue", 36, "bold"))
    else:
        lbl_result.config(font=("Helvetica Neue", 52, "bold"))
    lbl_result.config(text=t)

# ─────────────────────────────────────────────────────────────────────────────
#  LOGIQUE CONVERSION
# ─────────────────────────────────────────────────────────────────────────────
def convertir():
    valeur = entry_conv.get().strip()
    src = base_source.get()
    dst = base_dest.get()
    try:
        bases = {"BIN": 2, "OCT": 8, "DEC": 10, "HEX": 16}
        val_dec = int(valeur, bases[src])
        if dst == "BIN":  res = bin(val_dec)[2:]
        elif dst == "OCT": res = oct(val_dec)[2:]
        elif dst == "DEC": res = str(val_dec)
        else:              res = hex(val_dec)[2:].upper()
        lbl_conv_result.config(
            text=f"{valeur}  ({src})   →   {res}  ({dst})",
            fg=BTN_CONV)
        lbl_all_bin.config(text=f"BIN :   {bin(val_dec)[2:]}")
        lbl_all_oct.config(text=f"OCT :   {oct(val_dec)[2:]}")
        lbl_all_dec.config(text=f"DEC :   {val_dec}")
        lbl_all_hex.config(text=f"HEX :   {hex(val_dec)[2:].upper()}")
    except Exception:
        lbl_conv_result.config(text="Valeur invalide pour cette base", fg="#ff3b30")
        for lbl in [lbl_all_bin, lbl_all_oct, lbl_all_dec, lbl_all_hex]:
            lbl.config(text="—")

# ─────────────────────────────────────────────────────────────────────────────
#  UTILITAIRE BOUTON
# ─────────────────────────────────────────────────────────────────────────────
def make_btn(parent, text, bg, fg, cmd, width=5, height=2, fsize=17):
    btn = tk.Button(parent, text=text, bg=bg, fg=fg,
                    activebackground="#c8c8c8", activeforeground=fg,
                    font=("Helvetica Neue", fsize, "bold"),
                    width=width, height=height,
                    relief="flat", bd=0, cursor="hand2", command=cmd)
    btn.bind("<Enter>", lambda e, b=btn, o=bg: b.config(bg="#e0e0e0"))
    btn.bind("<Leave>", lambda e, b=btn, o=bg: b.config(bg=o))
    return btn

# ─────────────────────────────────────────────────────────────────────────────
#  SWITCH MODE
# ─────────────────────────────────────────────────────────────────────────────
def basculer_mode():
    if mode.get() == "CALC":
        mode.set("CONV")
        frame_calc.pack_forget()
        frame_conv.pack(fill="both", expand=True)
        btn_mode.config(text="⟵  Calculatrice")
    else:
        mode.set("CALC")
        frame_conv.pack_forget()
        frame_calc.pack(fill="both", expand=True)
        btn_mode.config(text="⇄  Bases numériques")

# ─────────────────────────────────────────────────────────────────────────────
#  INTERFACE PRINCIPALE
# ─────────────────────────────────────────────────────────────────────────────
container = tk.Frame(root, bg=BG)
container.pack()

# ── Barre du haut ──
topbar = tk.Frame(container, bg=BG)
topbar.pack(fill="x", padx=12, pady=(10, 2))

tk.Label(topbar, text="Calculatrice", bg=BG, fg="#333",
         font=("Helvetica Neue", 13, "bold")).pack(side="left")

btn_mode = tk.Button(topbar, text="⇄  Bases numériques",
                     bg=BTN_CONV, fg=FG_WHITE,
                     font=("Helvetica Neue", 10, "bold"),
                     relief="flat", bd=0, padx=10, pady=5,
                     cursor="hand2", command=basculer_mode)
btn_mode.pack(side="right")

# ══════════════════════════════════════════════════════════════════════════════
#  FRAME CALCULATRICE
# ══════════════════════════════════════════════════════════════════════════════
frame_calc = tk.Frame(container, bg=BG)
frame_calc.pack(fill="both", expand=True)

# Écran
ecran = tk.Frame(frame_calc, bg=WHITE, highlightthickness=1,
                 highlightbackground=BORDER)
ecran.pack(fill="x", padx=12, pady=(4, 4))

lbl_expr = tk.Label(ecran, text="", bg=WHITE, fg=FG_DIM,
                    font=("Helvetica Neue", 12), anchor="e", padx=12, pady=4)
lbl_expr.pack(fill="x")

lbl_result = tk.Label(ecran, text="0", bg=WHITE, fg=FG_MAIN,
                      font=("Helvetica Neue", 52, "bold"),
                      anchor="e", padx=12, pady=6)
lbl_result.pack(fill="x")

# Grille boutons
grid = tk.Frame(frame_calc, bg=BG)
grid.pack(padx=10, pady=4)

layout = [
    ("AC",  BTN_DARK, FG_MAIN, effacer_tout),
    ("+/-", BTN_DARK, FG_MAIN, plus_moins),
    ("%",   BTN_DARK, FG_MAIN, pourcentage),
    ("÷",   BTN_OP,   FG_WHITE, lambda: appuyer_op("/")),
    ("7",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("7")),
    ("8",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("8")),
    ("9",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("9")),
    ("×",   BTN_OP,   FG_WHITE, lambda: appuyer_op("*")),
    ("4",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("4")),
    ("5",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("5")),
    ("6",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("6")),
    ("−",   BTN_OP,   FG_WHITE, lambda: appuyer_op("-")),
    ("1",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("1")),
    ("2",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("2")),
    ("3",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("3")),
    ("+",   BTN_OP,   FG_WHITE, lambda: appuyer_op("+")),
    ("⌫",   BTN_DARK, FG_MAIN, backspace),
    ("0",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre("0")),
    (".",   BTN_LIGHT, FG_MAIN, lambda: appuyer_chiffre(".")),
    ("=",   BTN_OP,   FG_WHITE, calculer),
]

for i, (txt, bg, fg, cmd) in enumerate(layout):
    r, c = divmod(i, 4)
    btn = make_btn(grid, txt, bg, fg, cmd)
    btn.grid(row=r, column=c, padx=4, pady=4)

# ══════════════════════════════════════════════════════════════════════════════
#  FRAME CONVERSION
# ══════════════════════════════════════════════════════════════════════════════
frame_conv = tk.Frame(container, bg=BG)

tk.Label(frame_conv, text="Conversion de bases numériques",
         bg=BG, fg="#333", font=("Helvetica Neue", 13, "bold")).pack(pady=(10, 6))

# Saisie
tk.Label(frame_conv, text="Entrez votre valeur :", bg=BG, fg="#555",
         font=("Helvetica Neue", 11)).pack(anchor="w", padx=16)

entry_conv = tk.Entry(frame_conv, font=("Helvetica Neue", 22, "bold"),
                      bg=WHITE, fg=FG_MAIN, relief="flat", bd=0,
                      highlightthickness=1, highlightbackground=BORDER,
                      width=20, justify="right")
entry_conv.pack(padx=16, pady=(2, 10), ipady=8, fill="x")

# Sélecteurs
sel = tk.Frame(frame_conv, bg=BG)
sel.pack(padx=16, fill="x")

def make_selector(parent, label_txt, var):
    f = tk.Frame(parent, bg=BG)
    tk.Label(f, text=label_txt, bg=BG, fg="#444",
             font=("Helvetica Neue", 10, "bold")).pack(anchor="w", pady=(0, 3))
    row = tk.Frame(f, bg=BG)
    row.pack()
    for base in ["BIN", "OCT", "DEC", "HEX"]:
        rb = tk.Radiobutton(row, text=base, variable=var, value=base,
                            bg=BTN_LIGHT, fg=FG_MAIN,
                            selectcolor=BTN_CONV,
                            activebackground=BG,
                            font=("Helvetica Neue", 11, "bold"),
                            indicatoron=0, width=5,
                            relief="flat", bd=1, cursor="hand2",
                            padx=2, pady=5)
        rb.pack(side="left", padx=2)
    return f

frm_src = make_selector(sel, "Base source :", base_source)
frm_src.pack(side="left", padx=(0, 24))

frm_dst = make_selector(sel, "Base destination :", base_dest)
frm_dst.pack(side="left")

# Bouton convertir
btn_do = tk.Button(frame_conv, text="  Convertir  ➜",
                   bg=BTN_CONV, fg=FG_WHITE,
                   font=("Helvetica Neue", 13, "bold"),
                   relief="flat", bd=0, padx=18, pady=9,
                   cursor="hand2", command=convertir)
btn_do.pack(pady=(12, 4))

# Résultat principal
lbl_conv_result = tk.Label(frame_conv, text="", bg=BG, fg=BTN_CONV,
                           font=("Helvetica Neue", 15, "bold"), wraplength=340)
lbl_conv_result.pack(pady=(4, 8))

# Séparateur
tk.Frame(frame_conv, bg=BORDER, height=1).pack(fill="x", padx=16, pady=2)

# Toutes les bases
tk.Label(frame_conv, text="Toutes les représentations :",
         bg=BG, fg="#999", font=("Helvetica Neue", 10)).pack(anchor="w", padx=16, pady=(6, 2))

panel = tk.Frame(frame_conv, bg=WHITE, highlightthickness=1,
                 highlightbackground=BORDER)
panel.pack(fill="x", padx=16, pady=(0, 16))

lbl_all_bin = tk.Label(panel, text="BIN :   —", bg=WHITE, fg="#222",
                        font=("Courier New", 12), anchor="w", padx=14, pady=5)
lbl_all_oct = tk.Label(panel, text="OCT :   —", bg=WHITE, fg="#222",
                        font=("Courier New", 12), anchor="w", padx=14, pady=5)
lbl_all_dec = tk.Label(panel, text="DEC :   —", bg=WHITE, fg="#222",
                        font=("Courier New", 12), anchor="w", padx=14, pady=5)
lbl_all_hex = tk.Label(panel, text="HEX :   —", bg=WHITE, fg="#222",
                        font=("Courier New", 12), anchor="w", padx=14, pady=5)

for lbl in [lbl_all_bin, lbl_all_oct, lbl_all_dec, lbl_all_hex]:
    lbl.pack(fill="x")

# ─────────────────────────────────────────────────────────────────────────────
root.mainloop()