## Librerias
library(stringdist)
library(plyr)
library(dplyr)

## ----------------------------------------
## Global Variables
## ----------------------------------------
the_labels <- c("Cocoon",
                "Eli Corame",
                "Ema Valdemosa",
                "Lessan",
                "Libertad",
                "D mosseli",
                "Neon Nyx",
                "Nicoletta",
                "Punto Blanco",
                "D Moseli",
                "Bianchi",
                "Interno")

the_provs <- c("Cocoon",
               "Eli Corame",
               "Ema Valdemosa",
               "Lessan",
               "Libertad",
               "Neon Nyx",
               "Nicoletta",
               "Punto Blanco",
               "D Moseli",
               "Bianchi",
               "Interno")

assign_prov_marca <- function(prov, the_field){
    if(is.na(prov)){
        return(length(the_field) + 1)
    }
    which.min(stringdist(prov,
                         the_field,
                         method = 'jaccard'))[1]
}

assign_m_prov <- function(prov, the_field){
    laply(prov, function(t) t <- assign_prov_marca(t, the_field))
}

get_prov <- function(text){
    mod  <- str_extract(text, '^[^ ]+')
    prov <- str_replace(text, '^[^ ]+', '') %>%
        str_trim()
    c(mod, prov)
}

## ----------------------------------------
## Read in data
## ----------------------------------------



###########################################
## GOOD Old trial iter
###########################################
## Clean
data <- read.csv('../data/MARIANALATEST.csv',
                 stringsAsFactors = FALSE) %>%
    `colnames<-` (c('modelo',
                    'existencias_ant',
                    'n_existencias',
                    'dev',
                    'precio',
                    'pzas_ve',
                    'to_ve',
                    'x_ve',
                    'descripcion')) %>%
    select(modelo, n_existencias, precio, descripcion) %>%
    filter(!is.na(modelo))
### DIRTY
mod_provs <- llply(data$modelo, get_prov) 
mod_provs <- data.frame(do.call(rbind, mod_provs))
names(mod_provs)<- c('modelo', 'proveedor')
data$modelo <- NULL
data <- cbind(data, mod_provs)
### DIRTY
clean_data <- data %>%
    # separate(modelo, into = c('modelo', 'proveedor'), sep = ' ') %>%
    filter(!is.na(modelo)) %>%
    mutate(# modelo = str_extract(modelo, '[^\\*]+'),
           id_proveedor = assign_m_prov(proveedor, the_provs),
           id_marca = assign_m_prov(proveedor, the_labels),
           costo = precio,
           precio = costo * 2) 
    

clean_data$descripcion[is.na(clean_data$descripcion)] <- ''


clean_data$id_tienda <- 4
clean_data$notas <- ''

clean_data <- clean_data %>%
    select(modelo, n_existencias, precio, descripcion,
           id_proveedor, id_marca, costo, id_tienda, notas) %>%
    filter(costo > 0)

clean_data$articulo <- 'Prenda'

write.csv(clean_data, '../output_data/mariana.csv', row.names = FALSE)
